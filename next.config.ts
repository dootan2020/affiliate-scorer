import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.500fd.com",
      },
      {
        protocol: "https",
        hostname: "*.500fd.com",
      },
    ],
  },
};

export default nextConfig;
