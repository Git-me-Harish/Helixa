import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#f0f4f8" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}
        >
          <FileQuestion className="w-6 h-6" style={{ color: "#0284c7" }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "#0f172a" }}>
          Page not found
        </h2>
        <p className="text-sm mb-6" style={{ color: "#64748b" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "#0284c7", color: "#ffffff" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
