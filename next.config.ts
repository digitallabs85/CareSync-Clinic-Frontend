import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Logic: Mandatory for Electron. 
     This generates the 'out' folder containing static HTML/CSS/JS. */
//   output: 'export',

  /* Logic: Fixes the "White Screen" or 404 issue on refresh.
     Ensures that /dashboard becomes /dashboard/index.html so Electron can find it. */
  trailingSlash: true,

  /* Logic: Electron cannot run the Next.js default Image Optimization API. */
  images: {
    unoptimized: true,
  },

  /* Optional: If you encounter issues with strict mode during WebRTC implementation later,
     you might need to set this to false, but keep it true for now. */
  reactStrictMode: true,
};

export default nextConfig;