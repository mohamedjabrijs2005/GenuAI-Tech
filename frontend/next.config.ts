import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/pricing", destination: "/#pricing", permanent: false },
      { source: "/how-it-works", destination: "/#how-it-works", permanent: false },
      { source: "/product", destination: "/#problem", permanent: false },
      { source: "/for-candidates", destination: "/#candidates", permanent: false },
      { source: "/for-companies", destination: "/#companies", permanent: false },
      { source: "/subscription", destination: "/candidate/subscription", permanent: false },
      { source: "/vacancies", destination: "/candidate/vacancies", permanent: false },
      { source: "/genuai-landing/pricing", destination: "/#pricing", permanent: false },
      { source: "/genuai-landing/how-it-works", destination: "/#how-it-works", permanent: false },
      { source: "/genuai-landing/product", destination: "/#problem", permanent: false },
      { source: "/genuai-landing/candidates", destination: "/#candidates", permanent: false },
      { source: "/genuai-landing/companies", destination: "/#companies", permanent: false },
    ];
  },
  async rewrites() {
    return [
      // ─── Landing Page ───────────────────────────────────────────────
      { source: "/genuai-landing", destination: "/" },

      // ─── Auth ────────────────────────────────────────────────────────
      { source: "/genuai-landing/login", destination: "/login" },
      { source: "/genuai-landing/register", destination: "/login?mode=register" },

      // ─── Candidate Dashboard ─────────────────────────────────────────
      { source: "/candidate-dashboard", destination: "/candidate" },
      { source: "/candidate-dashboard/profile", destination: "/candidate/profile" },
      { source: "/candidate-dashboard/targets", destination: "/candidate/targets" },
      { source: "/candidate-dashboard/targets/:id", destination: "/candidate/targets/:id" },
      { source: "/candidate-dashboard/targets/:id/requirements", destination: "/candidate/targets/:id/requirements" },
      { source: "/candidate-dashboard/targets/:id/learn", destination: "/candidate/targets/:id/learn" },
      { source: "/candidate-dashboard/targets/:id/practice", destination: "/candidate/targets/:id/practice" },
      { source: "/candidate-dashboard/targets/:id/evidence", destination: "/candidate/targets/:id/evidence" },
      { source: "/candidate-dashboard/targets/:id/interview", destination: "/candidate/targets/:id/interview" },
      { source: "/candidate-dashboard/targets/:id/assessment", destination: "/candidate/targets/:id/assessment" },
      { source: "/candidate-dashboard/vacancies", destination: "/candidate/vacancies" },
      { source: "/candidate-dashboard/vacancies/:id", destination: "/candidate/vacancies/:id" },
      { source: "/candidate-dashboard/evidence", destination: "/candidate/evidence" },
      { source: "/candidate-dashboard/activity", destination: "/candidate/activity" },
      { source: "/candidate-dashboard/notifications", destination: "/candidate/notifications" },
      { source: "/candidate-dashboard/subscription", destination: "/candidate/subscription" },
      { source: "/candidate-dashboard/settings", destination: "/candidate/settings" },
      { source: "/candidate-dashboard/privacy", destination: "/candidate/privacy" },
      { source: "/candidate-dashboard/accessibility", destination: "/candidate/accessibility" },

      // ─── Company Dashboard ───────────────────────────────────────────
      { source: "/company-dashboard", destination: "/dashboard" },
      { source: "/company-dashboard/:path*", destination: "/dashboard/:path*" },

      // ─── Info & Landing Routes ───────────────────────────────────────
      { source: "/genuai-landing/subscription", destination: "/candidate/subscription" },
      { source: "/genuai-landing/vacancies", destination: "/candidate/vacancies" },
      { source: "/genuai-landing/contact", destination: "/contact" },
      { source: "/genuai-landing/privacy", destination: "/privacy" },
      { source: "/genuai-landing/terms", destination: "/terms" },
      { source: "/genuai-landing/trust", destination: "/trust" },

      // ─── API Proxy Fallback (Prevents 404 in deployed sites) ─────────
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || process.env.GENUAI_BACKEND_URL || "http://127.0.0.1:4000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
