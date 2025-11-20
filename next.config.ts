import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TEST_MODE: process.env.TEST_MODE || process.env.NEXT_PUBLIC_TEST_MODE || '0',
  },
  /* config options here */
};

export default nextConfig;
