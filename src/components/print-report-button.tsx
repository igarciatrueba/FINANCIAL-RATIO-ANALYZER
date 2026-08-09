"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReportButton() {
  return <Button className="print:hidden" onClick={() => window.print()} type="button" variant="secondary"><Printer aria-hidden="true" className="h-5 w-5" />Print / Save PDF</Button>;
}
