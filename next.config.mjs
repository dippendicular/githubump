/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    '/api/profile-views': ['./public/badge-fonts/*.woff2'],
    '/api/badge-assets': ['./public/badge-fonts/*.woff2'],
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
