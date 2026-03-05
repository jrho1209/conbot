/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14: external packages that must not be bundled (use Node.js APIs)
  experimental: {
    serverComponentsExternalPackages: ['bullmq', 'googleapis', 'postgres'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
