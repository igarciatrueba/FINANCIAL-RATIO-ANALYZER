import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { evaluateAnnualReportCorpusEntry } from "../src/features/annual-report-ingestion/lib/corpus-validation";
import { NativeAnnualReportExtractionPipeline } from "../src/server/document-extraction/annual-report-extraction-pipeline";
import { annualReportCorpus } from "../src/test/fixtures/annual-report-corpus";

const corpusDirectory = process.env.EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR;

if (!corpusDirectory) {
  throw new Error("Set EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR to a local cache of the approved primary-source PDFs. The harness never downloads reports.");
}

const pipeline = new NativeAnnualReportExtractionPipeline();
let failed = false;

for (const entry of annualReportCorpus) {
  const bytes = new Uint8Array(await readFile(join(corpusDirectory, entry.filename)));
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== entry.sha256) {
    failed = true;
    console.error(`${entry.company}: corpus checksum mismatch.`);
    continue;
  }

  const output = await pipeline.extract({ bytes, mimeType: "application/pdf" });
  const result = evaluateAnnualReportCorpusEntry({
    groundTruth: entry.groundTruth,
    draftFields: output.draftFields,
    candidates: output.candidates,
  });

  console.table([{
    company: entry.company,
    canonicalValuesPresent: result.canonicalValuesPresent,
    autoFilled: result.autoFilled,
    correct: result.correct,
    needsReview: result.needsReview,
    presentButMissed: result.presentButMissed,
    notPresent: result.notPresent,
    ambiguous: result.ambiguous,
    incorrect: result.incorrect,
    unsupported: result.unsupported,
    precision: result.precision === null ? "unavailable" : `${(result.precision * 100).toFixed(2)}%`,
    recall: result.recall === null ? "unavailable" : `${(result.recall * 100).toFixed(2)}%`,
  }]);
  if (result.incorrect || result.unsupported) {
    failed = true;
    console.error(`${entry.company}: incorrect=${result.incorrect}; unsupported=${result.unsupported}`);
  }
}

if (failed) process.exitCode = 1;
