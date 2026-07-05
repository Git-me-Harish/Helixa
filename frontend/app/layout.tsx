import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Helixa — AI Healthcare Platform",
  description: "AI-native healthcare intelligence ecosystem — your lifelong health record, physician discovery, FDA drug data, and predictive analytics in one platform.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <Toaster
            theme="light"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
                borderRadius: "12px",
                fontSize: "13px",
                boxShadow: "0 4px 6px -1px rgba(15,23,42,.07)",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
