import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["pg"],
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
  async redirects() {
    return [
      {
        source: "/playbook",
        destination: "/insights?tab=playbook",
        permanent: false,
      },
      {
        source: "/products",
        destination: "/inbox",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
