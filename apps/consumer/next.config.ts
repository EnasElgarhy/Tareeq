import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // Self-contained server bundle for the Docker image (see Dockerfile) —
  // App Runner runs `node server.js` from this output rather than
  // depending on a full node_modules install inside the container.
  output: "standalone",
  async headers() {
    const immutableMedia = [
      "/kai/kai-question-green-v3.mp4",
      "/kai/kai-intro-green-v2.mp4",
      "/kai/kai-rest-v2.webp",
      "/kai/kai-did-you-know-v3.mp4",
      "/kai/kai-did-you-know-rest-v3.webp",
    ];
    return [
      ...immutableMedia.map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      })),
      {
        source: "/audio/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
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
