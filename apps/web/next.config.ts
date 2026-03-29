import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@os-interact/ui', '@os-interact/types'],
};

export default nextConfig;
