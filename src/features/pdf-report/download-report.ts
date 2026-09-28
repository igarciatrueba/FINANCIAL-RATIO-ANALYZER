import pdfMake from "pdfmake/build/pdfmake";
import fonts from "pdfmake/build/vfs_fonts";
import type { ExecutiveDashboardViewModel } from "@/features/executive-dashboard/types/dashboard.types";
import { buildReportDocument } from "./report-document";

export async function downloadExecutiveReport(viewModel: ExecutiveDashboardViewModel): Promise<void> {
  // The 0.2 type package describes the older wrapper, whereas 0.2.23 exports the VFS directly.
  const document = pdfMake.createPdf(buildReportDocument(viewModel), undefined, undefined, fonts as unknown as Record<string, string>);
  const blob = await new Promise<Blob>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("PDF generation timed out")), 60_000);
    try {
      document.getBlob(result => { clearTimeout(timeout); resolve(result); });
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
  const url = URL.createObjectURL(blob);
  const anchor = documentElement();
  anchor.href = url;
  anchor.download = `equiverse-${viewModel.company.name.replace(/[^a-z0-9]+/gi, "-").slice(0, 80)}-${viewModel.period.currentYear}.pdf`;
  anchor.click();
  anchor.remove();
  // Allow the browser to take ownership of the download before releasing its URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function documentElement() {
  const anchor = document.createElement("a");
  document.body.appendChild(anchor);
  return anchor;
}
