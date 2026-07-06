"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Heart, Activity, Droplets, Thermometer, Weight, Zap,
  MessageSquare, Calendar, FileText, BarChart2, Stethoscope,
  Pill, ArrowRight, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { HealthSummary, HealthScore, AIInsight } from "@/types";
import { vitalStatus } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/queryKeys";

/* ── Vital card ──────────────────────────────────────────────────────────── */
const VITAL_META: Record<string, { label:string; unit:string; icon:React.ElementType; color:string; bg:string }> = {
  heart_rate:  { label:"Heart Rate",     unit:"bpm",    icon:Heart,       color:"#dc2626", bg:"#fef2f2" },
  bp_systolic: { label:"Blood Pressure", unit:"mmHg",   icon:Activity,    color:"#2563eb", bg:"#eff6ff" },
  spo2_pct:    { label:"SpO₂",           unit:"%",      icon:Droplets,    color:"#0891b2", bg:"#ecfeff" },
  glucose_mmol:{ label:"Glucose",        unit:"mmol/L", icon:Zap,         color:"#d97706", bg:"#fffbeb" },
  temp_celsius:{ label:"Temperature",    unit:"°C",     icon:Thermometer, color:"#7c3aed", bg:"#f5f3ff" },
  weight_kg:   { label:"Weight",         unit:"kg",     icon:Weight,      color:"#059669", bg:"#ecfdf5" },
};

const STATUS_COLOR: Record<string, {text:string;bg:string;border:string}> = {
  normal:   { text:"#059669", bg:"#ecfdf5",  border:"#a7f3d0" },
  warning:  { text:"#d97706", bg:"#fffbeb",  border:"#fde68a" },
  critical: { text:"#dc2626", bg:"#fef2f2",  border:"#fecaca" },
  unknown:  { text:"#94a3b8", bg:"#f8fafc",  border:"#e2e8f0" },
};

function VitalCard({ metricKey, value }: { metricKey: string; value: number | null }) {
  const meta = VITAL_META[metricKey];
  if (!meta) return null;
  const { icon:Icon, label, unit, color, bg } = meta;
  const status = vitalStatus(metricKey, value);
  const sc = STATUS_COLOR[status];

  return (
    <div className="card p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:bg}}>
        <Icon className="w-5 h-5" style={{color}}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium mb-1" style={{color:"#94a3b8"}}>{label}</div>
        <div className="text-xl font-bold leading-none" style={{color:"#0f172a"}}>
          {value != null ? value : <span style={{color:"#e2e8f0"}}>—</span>}
          {value != null && <span className="text-xs font-normal ml-1" style={{color:"#64748b"}}>{unit}</span>}
        </div>
      </div>
      {value != null && (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize flex-shrink-0"
          style={{color:sc.text, background:sc.bg, borderColor:sc.border}}>
          {status}
        </span>
      )}
    </div>
  );
}

/* ── Score ring ──────────────────────────────────────────────────────────── */
function ScoreRing({ score, grade }: { score:number; grade:string }) {
  const color = score >= 80 ? "#059669" : score >= 60 ? "#d97706" : "#dc2626";
  const bg    = score >= 80 ? "#ecfdf5"  : score >= 60 ? "#fffbeb"  : "#fef2f2";
  const r = 46, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[112px] h-[112px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
          <circle cx="52" cy="52" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)"}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{background:bg,borderRadius:"50%",margin:"12px"}}>
          <span className="text-[26px] font-extrabold leading-none" style={{color,fontFamily:"Plus Jakarta Sans,sans-serif"}}>{score}</span>
          <span className="text-sm font-bold" style={{color}}>{grade}</span>
        </div>
      </div>
      <span className="section-label">Health Score</span>
    </div>
  );
}

/* ── Insight chip ────────────────────────────────────────────────────────── */
function InsightChip({ insight }: { insight: AIInsight }) {
  const cfg = {
    positive: { color:"#059669", bg:"#ecfdf5",  border:"#a7f3d0" },
    warning:  { color:"#d97706", bg:"#fffbeb",  border:"#fde68a" },
    info:     { color:"#2563eb", bg:"#eff6ff",  border:"#bfdbfe" },
  }[insight.severity] ?? { color:"#64748b", bg:"#f8fafc", border:"#e2e8f0" };

  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl border"
      style={{background:cfg.bg, borderColor:cfg.border}}>
      <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{color:cfg.color}}/>
      <div>
        <div className="text-xs font-semibold mb-0.5" style={{color:cfg.color}}>{insight.title}</div>
        <div className="text-xs leading-relaxed" style={{color:"#64748b"}}>{insight.body}</div>
      </div>
    </div>
  );
}

/* ── Quick action ────────────────────────────────────────────────────────── */
function QuickAction({ href, label, icon:Icon, color, bg }: {
  href:string; label:string; icon:React.ElementType; color:string; bg:string;
}) {
  return (
    <Link href={href}
      className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md"
      style={{background:bg, borderColor:"transparent"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=color+"33";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";}}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:"white"}}>
        <Icon className="w-4.5 h-4.5" style={{color}}/>
      </div>
      <span className="text-sm font-medium" style={{color:"#334155"}}>{label}</span>
      <ArrowRight className="w-3.5 h-3.5 ml-auto" style={{color:"#94a3b8"}}/>
    </Link>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();

  const { data: summary, isLoading: summaryLoading } = useQuery<HealthSummary>({
    queryKey: QUERY_KEYS.healthSummary(),
    queryFn: () => api.get("/api/records/summary").then(r => r.data),
  });

  const { data: healthScore } = useQuery<HealthScore>({
    queryKey: QUERY_KEYS.healthScore(),
    queryFn: () => api.get("/api/analytics/health-score").then(r => r.data),
    retry: false,
  });

  const { data: insightsData } = useQuery<{ insights: AIInsight[] }>({
    queryKey: QUERY_KEYS.insights(30),
    queryFn: () => api.get("/api/analytics/insights?days=30").then(r => r.data),
    retry: false,
  });

  const vitals = summary?.latest_vitals ?? {};
  const insights = insightsData?.insights?.slice(0, 3) ?? [];
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <p className="text-sm mb-1" style={{color:"#94a3b8"}}>{greeting}</p>
        <h1 className="text-3xl font-bold" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
          {user ? `${user.first_name} ${user.last_name}` : "Your Health Dashboard"}
        </h1>
        <p className="text-sm mt-1" style={{color:"#64748b"}}>Here's your health overview for today</p>
      </motion.div>

      {/* Top row: score + insights */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Score */}
        <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}}
          className="card p-6 flex items-center justify-center">
          {healthScore
            ? <ScoreRing score={healthScore.score} grade={healthScore.grade}/>
            : (
              <div className="text-center py-4">
                <BarChart2 className="w-10 h-10 mx-auto mb-2" style={{color:"#e2e8f0"}}/>
                <p className="text-sm" style={{color:"#94a3b8"}}>Log vitals to calculate score</p>
              </div>
            )
          }
        </motion.div>

        {/* Insights */}
        <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{delay:.06}}
          className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4" style={{color:"#0284c7"}}/>
            <h2 className="font-semibold text-sm" style={{color:"#0f172a"}}>AI Health Insights</h2>
            <Link href="/analytics" className="ml-auto text-xs font-medium" style={{color:"#0284c7"}}>
              View all
            </Link>
          </div>
          {insights.length > 0 ? (
            <div className="space-y-2.5">
              {insights.map((ins, i) => <InsightChip key={i} insight={ins}/>)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle className="w-8 h-8 mb-2" style={{color:"#e2e8f0"}}/>
              <p className="text-sm" style={{color:"#94a3b8"}}>Log vital readings to generate AI insights</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Vitals grid */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold" style={{color:"#0f172a"}}>Latest Vitals</h2>
          <Link href="/records" className="text-xs font-medium" style={{color:"#0284c7"}}>
            Manage records <ArrowRight className="w-3 h-3 inline"/>
          </Link>
        </div>

        {summaryLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{color:"#0284c7"}}/>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {Object.keys(VITAL_META).map(key => (
              <VitalCard key={key} metricKey={key} value={(vitals[key] as number) ?? null}/>
            ))}
          </div>
        )}
      </motion.div>

      {/* Two-col: meds + quick actions */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Active medications */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.14}} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4" style={{color:"#0284c7"}}/>
              <h2 className="font-semibold text-sm" style={{color:"#0f172a"}}>Active Medications</h2>
            </div>
            <Link href="/records" className="text-xs font-medium" style={{color:"#0284c7"}}>Manage</Link>
          </div>
          {summary?.active_medications?.length ? (
            <div className="space-y-2">
              {summary.active_medications.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{borderColor:"#f1f5f9"}}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:"#0284c7"}}/>
                  <span className="text-sm font-medium flex-1" style={{color:"#334155"}}>{m.name}</span>
                  <span className="text-xs" style={{color:"#94a3b8"}}>{m.dosage} · {m.frequency}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm" style={{color:"#94a3b8"}}>No active medications logged</p>
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.18}}>
          <h2 className="font-semibold mb-3 text-sm" style={{color:"#0f172a"}}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction href="/chat"         label="Ask AI"         icon={MessageSquare} color="#0284c7" bg="#f0f9ff"/>
            <QuickAction href="/appointments" label="Book Appointment" icon={Calendar}     color="#059669" bg="#f0fdf4"/>
            <QuickAction href="/doctors"      label="Find Doctors"   icon={Stethoscope}   color="#7c3aed" bg="#f5f3ff"/>
            <QuickAction href="/pharmacy"     label="Drug Info"      icon={Pill}          color="#0891b2" bg="#ecfeff"/>
            <QuickAction href="/documents"    label="Upload Records" icon={FileText}      color="#d97706" bg="#fffbeb"/>
            <QuickAction href="/analytics"    label="Analytics"      icon={BarChart2}     color="#0d9488" bg="#f0fdf4"/>
          </div>
        </motion.div>
      </div>

      {/* Active conditions */}
      {summary?.active_conditions?.length ? (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.22}} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" style={{color:"#dc2626"}}/>
            <h2 className="font-semibold text-sm" style={{color:"#0f172a"}}>Active Conditions</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.active_conditions.map(c => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
                style={{borderColor:"#fecaca",background:"#fef2f2"}}>
                <span className="font-medium" style={{color:"#991b1b"}}>{c.condition}</span>
                {c.icd10_code && <span className="text-xs" style={{color:"#fca5a5"}}>{c.icd10_code}</span>}
                <span className="badge badge-warn text-[10px] capitalize">{c.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
