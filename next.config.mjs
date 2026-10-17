/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack or webpack settings
  serverExternalPackages: ["n3"],
};

export default nextConfig;
