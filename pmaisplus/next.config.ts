import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build — produz um servidor Node mínimo em .next/standalone
  // que o Dockerfile multi-stage consome.
  output: "standalone",
};

export default nextConfig;
