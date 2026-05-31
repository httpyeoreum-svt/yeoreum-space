import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only these hosts are optimized via next/image. Anything else (legacy
    // pasted URLs) falls back to a plain <img> in OptimizedImage, so an
    // unconfigured host never 400s.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hsrhvaxrdxovtxfcuhvp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Apple Music artwork (jackets registered from the Apple search).
      { protocol: "https", hostname: "**.mzstatic.com" },
    ],
    // Prefer AVIF, fall back to WebP, then the source format.
    formats: ["image/avif", "image/webp"],
    // Jackets/covers are immutable (Supabase uses unique filenames, mzstatic
    // URLs never change), so cache optimized variants for 31 days to cut
    // re-optimization cost and speed up repeat loads.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
