import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/arxiv": ["./node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"],
    "/api/pdf": ["./node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"],
  },
};

export default nextConfig;
