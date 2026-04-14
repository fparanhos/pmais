/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const api = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://outros-pmais-backend:8000";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};
export default nextConfig;
