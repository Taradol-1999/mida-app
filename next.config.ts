import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    localPatterns: [
      // Media URLs include entity and image IDs in the query string.
      { pathname: "/api/admin/media" },
      { pathname: "**", search: "" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Allow phones on the same Wi‑Fi to use the development server without
  // Next.js blocking client assets or interactive requests by origin.
  allowedDevOrigins: ["192.168.1.153"],
};

export default nextConfig;
