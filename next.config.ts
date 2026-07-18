import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The app lives in a parent folder that has its own package-lock.json. Without
  // this pin, Next.js may pick that parent as the workspace root, which pollutes  // file tracing and breaks chunk resolution across builds.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
