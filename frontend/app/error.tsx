"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Helixa] Unhandled error:", error);
  }, [error]);

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
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <AlertTriangle className="w-6 h-6" style={{ color: "#dc2626" }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "#0f172a" }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-6" style={{ color: "#64748b" }}>
          An unexpected error occurred. Your health data is safe — this is a
          display issue only.
        </p>
        {error.digest && (
          <p className="text-xs mb-4 font-mono" style={{ color: "#94a3b8" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "#0284c7", color: "#ffffff" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#0369a1")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#0284c7")
          }
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
