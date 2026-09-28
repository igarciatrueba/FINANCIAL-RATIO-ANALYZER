"use client";

import { Printer } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExecutiveDashboardViewModel } from "@/features/executive-dashboard/types/dashboard.types";

export function PrintReportButton({ viewModel }: { viewModel: ExecutiveDashboardViewModel }) {
  const pending = useRef(false);
  const [status, setStatus] = useState("");
  async function download() {
    if (pending.current) return;
    pending.current = true;
    setStatus("Preparing PDF report.");
    try {
      const { downloadExecutiveReport } = await import("@/features/pdf-report/download-report");
      await downloadExecutiveReport(viewModel);
      setStatus("PDF report downloaded.");
    } catch {
      setStatus("PDF generation failed. Please try again.");
      window.alert("The PDF could not be generated. Please try again.");
    } finally {
      pending.current = false;
    }
  }
  return <><Button className="print:hidden" onClick={download} type="button" variant="secondary"><Printer aria-hidden="true" className="h-5 w-5" />Print / Save PDF</Button><span className="sr-only" role="status">{status}</span></>;
}
