import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // omuclub.com(www 없음)으로 들어오면 www.omuclub.com 으로 영구 이동
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "omuclub.com" }],
        destination: "https://www.omuclub.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
