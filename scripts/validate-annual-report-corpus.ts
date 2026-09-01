import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import corpus from "../src/test/fixtures/annual-report-corpus.json" with { type: "json" };
import { NativeAnnualReportExtractionPipeline } from "../src/server/document-extraction/annual-report-extraction-pipeline";

type CorpusEntry = {
  id: string;
  company: string;
  filename: string;
  sha256: string;
  sourceUrl: string;
  expected: Record<string, string>;
};

const corpusDirectory = process.env.EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR;

if (!corpusDirectory) {
  throw new Error("Set EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR to a local cache of the approved primary-source PDFs. The harness never downloads reports.");
}

const pipeline = new NativeAnnualReportExtractionPipeline();
let failed = false;

for (const entry of corpus as CorpusEntry[]) {
  const bytes = new Uint8Array(await readFile(join(corpusDirectory, entry.filename)));
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== entry.sha256) {
    failed = true;
    console.error(`${entry.company}: corpus checksum mismatch.`);
    continue;
  }

  const output = await pipeline.extract({ bytes, mimeType: "application/pdf" });
  const autoFilled = output.draftFields.filter((field) => field.formValue !== null);
  const actual = new Map(autoFilled.map((field) => [`${field.canonicalFieldKey}:${field.periodSlotIndex}`, field.formValue!]));
  const incorrect = Object.entries(entry.expected).filter(([key, value]) => actual.get(key) !== value).map(([key]) => key);
  const unsupportedAutoFilled = [...actual.keys()].filter((key) => !(key in entry.expected));
  const correct = Object.keys(entry.expected).filter((key) => actual.get(key) === entry.expected[key]).length;
  const needsReview = output.draftFields.filter((field) => field.reviewState === "NEEDS_REVIEW" && field.candidateReference !== null).length;
  const missing = output.draftFields.filter((field) => field.provenanceType === "NOT_FOUND").length;

  console.table([{
    company: entry.company,
    groundTruthFields: Object.keys(entry.expected).length,
    autoFilled: autoFilled.length,
    correct,
    needsReview,
    missing,
    incorrect: incorrect.length,
    unsupportedAutoFilled: unsupportedAutoFilled.length,
  }]);
  if (incorrect.length || unsupportedAutoFilled.length) {
    failed = true;
    console.error(`${entry.company}: incorrect=${incorrect.join(",") || "none"}; unsupportedAutoFilled=${unsupportedAutoFilled.join(",") || "none"}`);
  }
}

if (failed) process.exitCode = 1;
