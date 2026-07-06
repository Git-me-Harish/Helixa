"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar, MobileDrawer } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, restoreSession } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!mounted) return;
    const token = sessionStorage.getItem("helixa_token");
    if (!token && !isAuthenticated) router.replace("/login");
  }, [mounted, isAuthenticated, router]);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Before hydration completes, both server and client render the same
  // loading state — prevents the "Expected <aside> in <div>" mismatch.
  if (!mounted || (!isAuthenticated && !sessionStorage.getItem("helixa_token"))) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:"#f0f4f8"}}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin" style={{color:"#0284c7"}}/>
          <span className="text-sm" style={{color:"#64748b"}}>Loading Helixa…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background:"#f0f4f8"}}>
      {/* Desktop sidebar — hidden on < lg via its own className */}
      <Sidebar/>

      {/* Mobile slide-in drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}/>

      {/* Main content column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar — only visible < lg */}
        <div className="flex items-center h-14 px-4 flex-shrink-0 lg:hidden"
          style={{background:"white",borderBottom:"1px solid #e2e8f0"}}>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors mr-3"
            style={{color:"#64748b"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#f1f5f9";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            <Menu className="w-5 h-5"/>
          </button>
          <span className="font-bold text-base" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>
            Helixa
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
