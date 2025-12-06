/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  turbopack: {},

  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
