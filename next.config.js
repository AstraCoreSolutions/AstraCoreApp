/**
 * @type {import('next').NextConfig}
 *
 * This configuration enables the experimental App Router and
 * React strict mode.  The App Router allows for server and
 * client components and simplifies routing under the `app` folder.
 */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
