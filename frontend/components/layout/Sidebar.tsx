"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, FileText, Upload, Calendar,
  BarChart2, Stethoscope, Pill, Heart, ChevronLeft,
  ChevronRight, LogOut, User, Dumbbell, Syringe, Users,
  PhoneCall, ShieldCheck, Activity, ClipboardList, Layers, GitCommitVertical, X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function HelixaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="#0284c7"/>
      <path d="M8 16C8 11.582 11.582 8 16 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 16C24 20.418 20.418 24 16 24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="3.5" fill="#fff"/>
    </svg>
  );
}

const NAV = [
  {
    section: "Workspace",
    items: [
      { href:"/dashboard",    label:"Overview",       icon:LayoutDashboard     },
      { href:"/chat",         label:"AI Health Chat", icon:MessageSquare       },
      { href:"/analytics",    label:"Analytics",      icon:BarChart2           },
      { href:"/timeline",     label:"Health Timeline",icon:GitCommitVertical   },
    ],
  },
  {
    section: "Health Data",
    items: [
      { href:"/records",           label:"My Records",      icon:FileText     },
      { href:"/documents",         label:"Documents",        icon:Upload       },
      { href:"/appointments",      label:"Appointments",     icon:Calendar     },
      { href:"/wellness",          label:"Wellness",         icon:Dumbbell     },
      { href:"/symptoms",          label:"Symptoms",         icon:Activity     },
      { href:"/vaccinations",      label:"Vaccinations",     icon:Syringe      },
      { href:"/clinical-notes",    label:"Clinical Notes",   icon:ClipboardList},
      { href:"/treatment-plans",   label:"Treatment Plans",  icon:Layers       },
    ],
  },
  {
    section: "My People",
    items: [
      { href:"/family",            label:"Family",           icon:Users        },
      { href:"/emergency-contacts",label:"Emergency",        icon:PhoneCall    },
      { href:"/insurance",         label:"Insurance",        icon:ShieldCheck  },
    ],
  },
  {
    section: "Discover",
    items: [
      { href:"/doctors",      label:"Find Doctors",  icon:Stethoscope      },
      { href:"/pharmacy",     label:"Pharmacy",      icon:Pill             },
      { href:"/specialties",  label:"Specialties",   icon:Heart            },
    ],
  },
];

function getInitials(first?: string, last?: string): string {
  return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "?";
}

/* ── Shared nav content (used in both desktop and mobile drawer) ─────────── */
function NavContent({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); router.replace("/login"); };

  return (
    <>
      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}}
                  className="section-label px-3 mb-2">{section}</motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-0.5">
              {items.map(({ href, label, icon:Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href} onClick={onNavClick}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all"
                    style={{
                      color: active ? "#0284c7" : "#64748b",
                      background: active ? "#e0f2fe" : "transparent",
                    }}
                    onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#334155"; } }}
                    onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#64748b"; } }}
                    title={collapsed ? label : undefined}>
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{minWidth:18}}/>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}}
                          transition={{duration:.15}} className="whitespace-nowrap overflow-hidden">
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User + logout */}
      <div className="flex-shrink-0 p-2 space-y-1" style={{borderTop:"1px solid #e2e8f0"}}>
        <Link href="/profile" onClick={onNavClick}
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-colors"
          style={{background:"#f8fafc"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#e0f2fe";}}
          onMouseLeave={e=>{e.currentTarget.style.background="#f8fafc";}}
          title={collapsed ? "Profile" : undefined}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{background:"#e0f2fe",color:"#0284c7"}}>
            {user ? getInitials(user.first_name, user.last_name) : <User className="w-4 h-4"/>}
          </div>
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}}
                transition={{duration:.15}} className="overflow-hidden min-w-0 flex-1">
                <div className="text-xs font-semibold truncate" style={{color:"#0f172a"}}>
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-[10px] truncate" style={{color:"#94a3b8"}}>{user.email}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <button onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{color:"#94a3b8"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#dc2626";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#94a3b8";}}>
          <LogOut className="w-4 h-4 flex-shrink-0"/>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}}
                transition={{duration:.15}} className="whitespace-nowrap">
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );
}

/* ── Desktop sidebar (lg+) ───────────────────────────────────────────────── */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ ease: [.16, 1, .3, 1], duration: .3 }}
      className="hidden lg:flex flex-shrink-0 flex-col h-screen overflow-hidden"
      style={{
        background: "white",
        borderRight: "1px solid #e2e8f0",
        boxShadow: "1px 0 0 #e2e8f0",
      }}>

      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-3 h-16 flex-shrink-0" style={{borderBottom:"1px solid #e2e8f0"}}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}}
              transition={{duration:.18}} className="flex items-center gap-2.5 overflow-hidden">
              <HelixaLogo size={28}/>
              <span className="font-bold text-base whitespace-nowrap" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>
                Helixa
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && <HelixaLogo size={28}/>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          style={{color:"#94a3b8"}}
          onMouseEnter={e=>{e.currentTarget.style.background="#f1f5f9";e.currentTarget.style.color="#334155";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#94a3b8";}}>
          {collapsed ? <ChevronRight className="w-3.5 h-3.5"/> : <ChevronLeft className="w-3.5 h-3.5"/>}
        </button>
      </div>

      <NavContent collapsed={collapsed}/>
    </motion.aside>
  );
}

/* ── Mobile drawer (< lg) ───────────────────────────────────────────────── */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:.2}}
            className="fixed inset-0 z-40 lg:hidden"
            style={{background:"rgba(15,23,42,0.45)",backdropFilter:"blur(4px)"}}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}}
            transition={{ease:[.16,1,.3,1],duration:.3}}
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 lg:hidden"
            style={{background:"white",borderRight:"1px solid #e2e8f0",boxShadow:"4px 0 24px rgba(15,23,42,.12)"}}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 flex-shrink-0"
              style={{borderBottom:"1px solid #e2e8f0"}}>
              <div className="flex items-center gap-2.5">
                <HelixaLogo size={28}/>
                <span className="font-bold text-base" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,Inter,sans-serif"}}>
                  Helixa
                </span>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{color:"#94a3b8"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#f1f5f9";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                <X className="w-4 h-4"/>
              </button>
            </div>

            <NavContent collapsed={false} onNavClick={onClose}/>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
