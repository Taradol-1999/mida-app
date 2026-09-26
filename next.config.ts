import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow phones on the same Wi‑Fi to use the development server without
  // Next.js blocking client assets or interactive requests by origin.
  allowedDevOrigins: ["192.168.1.135"],
};

export default nextConfig;
