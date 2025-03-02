// @ts-expect-error - next-intl/plugin uses require
const withNextIntl = require("next-intl/plugin")("./src/locales/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirects configuration
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
