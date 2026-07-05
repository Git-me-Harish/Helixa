"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { Zap, Activity, Loader2, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import type { HealthScore, AIInsight } from "@/types";
import { formatDate } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/queryKeys";

const PERIODS = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
] as const;

const VITALS_CONFIG = [
  { key: "bp_systolic", label: "Systolic BP",  color: "#0284c7", unit: "mmHg", chartType: "line" as const },
  { key: "heart_rate",  label: "Heart Rate",   color: "#7c3aed", unit: "bpm",  chartType: "line" as const },
  { key: "spo2_pct",    label: "SpO2",         color: "#059669", unit: "%",    chartType: "bar"  as const },
  { key: "weight_kg",   label: "Weight",       color: "#d97706", unit: "kg",   chartType: "bar"  as const },
];

/* -- Chart tooltip -------------------------------------------------------- */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-xs"
      style={{background:"#ffffff",border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(15,23,42,0.08)"}}>
      <div className="mb-1.5" style={{color:"#64748b"}}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{background:p.color || p.fill}}/>
          <span style={{color:"#64748b"}}>{p.name}:</span>
          <span className="font-medium" style={{color:"#0f172a"}}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* -- Health score ring ---------------------------------------------------- */
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const color   = score >= 80 ? "#059669" : score >= 60 ? "#d97706" : "#dc2626";
  const bgTint  = score >= 80 ? "#ecfdf5" : score >= 60 ? "#fffbeb" : "#fef2f2";
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[136px] h-[136px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10"/>
          <circle cx="64" cy="64" r={r} fill={bgTint} stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)"}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[32px] font-bold leading-none" style={{color}}>{score}</span>
          <span className="text-[16px] font-bold" style={{color}}>{grade}</span>
        </div>
      </div>
      <span className="section-label">Overall Health Score</span>
    </div>
  );
}

/* -- Insight card --------------------------------------------------------- */
function InsightCard({ insight }: { insight: AIInsight }) {
  const cfg = {
    info:     { color:"#2563eb", bg:"#eff6ff",  border:"#bfdbfe" },
    warning:  { color:"#d97706", bg:"#fffbeb",  border:"#fde68a" },
    positive: { color:"#059669", bg:"#ecfdf5",  border:"#a7f3d0" },
  }[insight.severity] ?? { color:"#334155", bg:"#f0f4f8", border:"#e2e8f0" };

  return (
    <div className="px-4 py-3.5 rounded-xl" style={{background:cfg.bg,border:`1px solid ${cfg.border}`}}>
      <div className="flex items-start gap-2.5">
        <Zap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{color:cfg.color}}/>
        <div>
          <div className="text-[13px] font-medium mb-0.5" style={{color:cfg.color}}>{insight.title}</div>
          <div className="text-xs leading-relaxed" style={{color:"#334155"}}>{insight.body}</div>
          <div className="text-[11px] mt-1 capitalize" style={{color:"#64748b"}}>{insight.category}</div>
        </div>
      </div>
    </div>
  );
}

/* -- Page ----------------------------------------------------------------- */
export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);

  const { data: healthScore, isLoading: scoreLoading } = useQuery<HealthScore>({
    queryKey: QUERY_KEYS.healthScore(),
    queryFn: () => api.get("/api/analytics/health-score").then(r => r.data),
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: QUERY_KEYS.vitalTrends(period),
    queryFn: () => api.get(`/api/analytics/trends?days=${period}`).then(r => r.data),
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery<{ insights: AIInsight[] }>({
    queryKey: QUERY_KEYS.insights(period),
    queryFn: () => api.get(`/api/analytics/insights?days=${period}`).then(r => r.data),
  });

  const trends: any[] = trendsData?.trends ?? [];
  const insights = insightsData?.insights ?? [];

  const radarData = healthScore?.breakdown
    ? Object.entries(healthScore.breakdown).map(([key, val]) => ({
        metric: key.replace(/_/g," ").replace(/\b\w/g, l => l.toUpperCase()),
        score: typeof val === "object" ? val.score : 0,
      }))
    : [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto" style={{background:"#f0f4f8",minHeight:"100vh"}}>

      {/* Header */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{color:"#0f172a"}}>Health Analytics</h1>
            <p className="text-sm" style={{color:"#64748b"}}>Trends, insights, and health score analysis</p>
          </div>
          {/* Period selector */}
          <div className="flex gap-0.5 p-1 rounded-xl"
            style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>
            {PERIODS.map(({ label, days }) => (
              <button key={days} onClick={() => setPeriod(days)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: period === days ? "#0284c7" : "transparent",
                  border: "1px solid transparent",
                  color: period === days ? "#ffffff" : "#64748b",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Top row: score + radar */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">

        {/* Score */}
        <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
          className="card p-6 flex items-center justify-center">
          {scoreLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" style={{color:"#0284c7"}}/>
          ) : healthScore ? (
            <ScoreRing score={healthScore.score} grade={healthScore.grade}/>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold mb-2" style={{color:"#94a3b8"}}>-</div>
              <p className="text-sm" style={{color:"#64748b"}}>Log vitals to see score</p>
            </div>
          )}
        </motion.div>

        {/* Radar breakdown */}
        <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} transition={{delay:0.07}}
          className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium mb-4" style={{color:"#334155"}}>Health score breakdown</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0"/>
                <PolarAngleAxis dataKey="metric" tick={{fill:"#94a3b8",fontSize:10}}/>
                <Radar name="Score" dataKey="score" stroke="#0284c7" fill="#0284c7" fillOpacity={0.08} strokeWidth={1.5}/>
                <Tooltip contentStyle={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:8,color:"#0f172a",fontSize:12}}/>
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm" style={{color:"#64748b"}}>
              Log vital readings to see breakdown
            </div>
          )}
        </motion.div>
      </div>

      {/* Trend charts grid */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {VITALS_CONFIG.map((v, idx) => (
          <motion.div key={v.key}
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.12+idx*0.05}}
            className="card p-5">
            <h3 className="text-sm font-medium mb-4" style={{color:"#334155"}}>
              {v.label}
              <span className="ml-1.5 text-xs font-normal" style={{color:"#94a3b8"}}>({v.unit})</span>
            </h3>
            {trendsLoading ? (
              <div className="flex items-center justify-center h-[160px]">
                <Loader2 className="w-4 h-4 animate-spin" style={{color:"#0284c7"}}/>
              </div>
            ) : trends.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                {v.chartType === "line" ? (
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false} domain={["auto","auto"]}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Line type="monotone" dataKey={v.key} stroke={v.color} strokeWidth={1.5} dot={false} name={v.label}/>
                  </LineChart>
                ) : (
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false} domain={["auto","auto"]}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Bar dataKey={v.key} fill={v.color} fillOpacity={0.7} radius={[3,3,0,0]} name={v.label}/>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[160px] text-sm" style={{color:"#64748b"}}>
                Not enough data yet
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* AI Insights */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" style={{color:"#0284c7"}}/>
          <h2 className="font-semibold" style={{color:"#0f172a"}}>AI Health Insights</h2>
        </div>

        {insightsLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{color:"#0284c7"}}/>
          </div>
        ) : insights.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, i) => <InsightCard key={i} insight={insight}/>)}
          </div>
        ) : (
          <div className="card py-10 text-center">
            <Activity className="w-10 h-10 mx-auto mb-3" style={{color:"#94a3b8"}}/>
            <p className="text-sm" style={{color:"#64748b"}}>Log more vital readings to generate AI health insights</p>
          </div>
        )}
      </motion.div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl mt-8"
        style={{background:"#fffbeb",border:"1px solid #fde68a"}}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color:"#92400e"}}/>
        <p className="text-xs leading-relaxed" style={{color:"#92400e"}}>
          All insights are AI-generated for informational purposes only. They do not constitute medical advice,
          diagnosis, or treatment recommendations. Always consult a qualified healthcare provider.
        </p>
      </div>
    </div>
  );
}
