import type { NextConfig } from "next";

// Static export (no Node server at runtime) served from a "/uhuracrowd"
// subpath — this app is meant to be deployed alongside other static sites
// under one host/CDN, not standalone at a domain root. Consequences worth
// knowing:
//   - `next dev`/`next build` serve everything under /uhuracrowd too, so
//     http://localhost:3000/ alone 404s — the app lives at
//     http://localhost:3000/uhuracrowd.
//   - `images: unoptimized` is required by `output: "export"` — the default
//     Next.js Image optimizer needs a server and isn't available in a
//     static export.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/uhuracrowd",
  images: { unoptimized: true },
};

export default nextConfig;
