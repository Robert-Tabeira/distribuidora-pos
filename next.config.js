/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/fonts/google/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }, {
      source: '/api/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }]
  },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [{ protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, pathname: '/storage/v1/object/public/**' }]
      : [],
    formats: ['image/webp'],
    minimumCacheTTL: 2592000,
  },
  // Reduce problemas de bloqueo en Windows
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig
