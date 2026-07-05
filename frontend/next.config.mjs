/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  async rewrites() {
    return [
      /* Proxy backend API — excludes Next.js API routes (/api/doctors, /api/drugs) */
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8000/api/auth/:path*",
      },
      {
        source: "/api/health/:path*",
        destination: "http://localhost:8000/api/health/:path*",
      },
      {
        source: "/api/vitals/:path*",
        destination: "http://localhost:8000/api/vitals/:path*",
      },
      {
        source: "/api/medications/:path*",
        destination: "http://localhost:8000/api/medications/:path*",
      },
      {
        source: "/api/allergies/:path*",
        destination: "http://localhost:8000/api/allergies/:path*",
      },
      {
        source: "/api/history/:path*",
        destination: "http://localhost:8000/api/history/:path*",
      },
      {
        source: "/api/records/:path*",
        destination: "http://localhost:8000/api/records/:path*",
      },
      {
        source: "/api/documents/:path*",
        destination: "http://localhost:8000/api/documents/:path*",
      },
      {
        source: "/api/appointments/:path*",
        destination: "http://localhost:8000/api/appointments/:path*",
      },
      {
        source: "/api/chat/:path*",
        destination: "http://localhost:8000/api/chat/:path*",
      },
      {
        source: "/api/analytics/:path*",
        destination: "http://localhost:8000/api/analytics/:path*",
      },
      {
        source: "/api/speech/:path*",
        destination: "http://localhost:8000/api/speech/:path*",
      },
      {
        source: "/api/wellness/:path*",
        destination: "http://localhost:8000/api/wellness/:path*",
      },
      {
        source: "/api/vaccinations/:path*",
        destination: "http://localhost:8000/api/vaccinations/:path*",
      },
      {
        source: "/api/family/:path*",
        destination: "http://localhost:8000/api/family/:path*",
      },
      {
        source: "/api/emergency-contacts/:path*",
        destination: "http://localhost:8000/api/emergency-contacts/:path*",
      },
      {
        source: "/api/insurance/:path*",
        destination: "http://localhost:8000/api/insurance/:path*",
      },
      {
        source: "/api/symptoms/:path*",
        destination: "http://localhost:8000/api/symptoms/:path*",
      },
      {
        source: "/api/soap-notes/:path*",
        destination: "http://localhost:8000/api/soap-notes/:path*",
      },
      {
        source: "/api/treatment-plans/:path*",
        destination: "http://localhost:8000/api/treatment-plans/:path*",
      },
    ];
  },
};

export default nextConfig;
