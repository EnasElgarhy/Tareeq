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
};

export default nextConfig;
