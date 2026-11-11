import type { NextConfig } from 'next';

// Static export: no server state. The only server code is the Cloudflare Pages Function in /functions (added later).
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
