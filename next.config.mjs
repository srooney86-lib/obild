/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['n3'],
  webpack: (config) => {
    config.cache = false; // D드라이브 readlink 충돌 방지를 위해 캐시 비활성화
    return config;
  },
};

export default nextConfig;