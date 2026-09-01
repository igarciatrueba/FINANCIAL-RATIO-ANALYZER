import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
