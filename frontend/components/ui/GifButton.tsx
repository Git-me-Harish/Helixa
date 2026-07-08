"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

interface GifButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Size of the inner gif circle in px. Default 44. */
  gifSize?: number;
  className?: string;
}

/**
 * Brand CTA button: pill shape, dark background, inner animated GIF circle on the left.
 * Reusable across the product — just drop in and provide an onClick + label.
 */
export function GifButton({
  label,
  onClick,
  disabled = false,
  loading = false,
  gifSize = 44,
  className = "",
}: GifButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`gif-btn group relative inline-flex items-center gap-0 rounded-full transition-all select-none ${className}`}
      style={{
        background: "#000000",
        padding: "5px 28px 5px 5px",
        boxShadow: "0 0 0 1.5px rgba(157,147,193,0.2), 0 8px 28px rgba(0,0,0,0.4)",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {/* Inner GIF circle */}
      <span
        className="relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ width: gifSize, height: gifSize, background: "#111" }}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Image
            src="/images/button.gif"
            alt=""
            width={gifSize}
            height={gifSize}
            className="w-full h-full object-cover"
            unoptimized
          />
        )}
        {/* Subtle inner ring */}
        <span
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
        />
      </span>

      {/* Label */}
      <span
        className="ml-3 text-sm font-semibold tracking-wide transition-colors"
        style={{ color: "#F0EEF8" }}
      >
        {label}
      </span>

      {/* Hover shimmer ring */}
      <span
        className="gif-btn-ring absolute inset-0 rounded-full pointer-events-none transition-all"
        style={{ boxShadow: "0 0 0 0 rgba(157,147,193,0)" }}
      />

      <style>{`
        .gif-btn:hover .gif-btn-ring {
          box-shadow: 0 0 0 3px rgba(157,147,193,0.3);
        }
        .gif-btn:active {
          transform: scale(0.97);
        }
      `}</style>
    </button>
  );
}
