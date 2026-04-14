import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next_runtime",
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
