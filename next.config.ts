import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      {
        // /profile predates the Home/Explore/Kai/You redesign — /you is
        // its replacement (see app/(app)/layout.tsx).
        source: "/profile",
        destination: "/you",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
