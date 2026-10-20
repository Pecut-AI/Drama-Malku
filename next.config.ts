import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  images: {
    minimumCacheTTL: 7200, // Cache optimized images for 2 hours
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgcdnmi.dramaboxdb.com",
      },
      {
        protocol: "https",
        hostname: "hwztchapter.dramaboxdb.com",
      },
      {
        protocol: "https",
        hostname: "awscover.netshort.com",
      },
      {
        protocol: "https",
        hostname: "static.netshort.com",
      },
      {
        protocol: "https",
        hostname: "cover.netshort.com",
      },
      {
        protocol: "https",
        hostname: "alicdn.netshort.com",
      },
      {
        protocol: "https",
        hostname: "zshipubcdn.farsunpteltd.com",
      },
      {
        protocol: "https",
        hostname: "zshipricf.farsunpteltd.com",
      },
      {
        protocol: "https",
        hostname: "wsrv.nl",
      },
    ],
  },
  async headers() {
    return [
      {
        // Header keamanan untuk semua halaman (Evolusi P2, 20 Okt 2026).
        // CSP masih mode Report-Only agar tidak mematahkan player HLS dan
        // gambar eksternal yang sudah berjalan — pantau laporannya dulu,
        // baru pertimbangkan mode penegakan penuh.
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value:
              "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-ancestors 'self'",
          },
        ],
      },
      {
        // Cache all static assets (JS, CSS, fonts, etc.) for 1 year (immutable)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache Next.js optimized images for 2 hours
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=7200, stale-while-revalidate=3600",
          },
        ],
      },
      {
        // Cache public assets (favicon, logos, etc.) for 2 hours
        source: "/:path(.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=7200, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
