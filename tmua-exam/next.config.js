/** @type {import('next').NextConfig} */
const esatEnabled = process.env.ENABLE_ESAT === '1'

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async redirects() {
    if (esatEnabled) {
      return []
    }

    return [
      {
        source: '/esat',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/esat/:path*',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
