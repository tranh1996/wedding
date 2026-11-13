/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide the "N" dev-tools badge shown in the corner during `next dev`.
  devIndicators: false,
  // The groom's page lives at "/"; old links to /nha-trai still work.
  // Temporary (307), so browsers do not cache it forever if the URLs change again.
  redirects() {
    return [{ source: "/nha-trai", destination: "/", permanent: false }];
  },
};
export default nextConfig;
