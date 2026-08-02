import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Financial Ratio Analyzer",
    template: "%s | Financial Ratio Analyzer",
  },
  description:
    "Interactive financial health assessment and scenario-analysis platform for simplified corporate financial statements.",
  applicationName: "Financial Ratio Analyzer",
  authors: [{ name: "Iker García Trueba" }],
  creator: "Iker García Trueba",
  metadataBase: new URL("https://financial-ratio-analyzer.vercel.app"),
  openGraph: {
    title: "Financial Ratio Analyzer",
    description:
      "Transform simplified financial statements into transparent, decision-ready financial insights.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
