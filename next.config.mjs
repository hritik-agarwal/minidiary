/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/mydiary",
  assetPrefix: "/mydiary/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
