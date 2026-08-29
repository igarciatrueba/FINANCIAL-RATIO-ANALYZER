import type { Metadata, Viewport } from "next";

import { BRAND } from "@/lib/brand";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Interactive financial health assessment and scenario-analysis platform for simplified corporate financial statements.",
  applicationName: BRAND.name,
  authors: [{ name: "Iker García Trueba" }],
  creator: "Iker García Trueba",
  openGraph: {
    title: BRAND.name,
    description:
      "Transform simplified financial statements into transparent, decision-ready financial insights.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/social-preview.svg", width: 1200, height: 630, alt: BRAND.name }],
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>{children}</body>
    </html>
  );
}
