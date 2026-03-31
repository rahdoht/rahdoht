import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ipfs.dweb.link",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
      },
    ],
  },
};

export default nextConfig;
