"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dumbbell, Moon, Droplets, Salad, Brain, Heart,
  Plus, Loader2, TrendingUp, Check, X
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import api from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

type Category = "fitness" | "sleep" | "hydration" | "nutrition" | "stress" | "meditation";

interface WellnessEntry {
  id: string;
  logged_at: string;
  category: Category;
  value: number;
  unit: string;
  notes: string | null;
}

const CAT_CONFIG: Record<Category, {
  label: string; unit: string; icon: React.ElementType;
  color: string; bg: string; placeholder: string; max: number;
}> = {
  fitness:    { label:"Steps",      unit:"steps",    icon:Dumbbell,   color:"#0284c7", bg:"#e0f2fe",  placeholder:"e.g. 8000",  max:30000 },
  sleep:      { label:"Sleep",      unit:"hours",    icon:Moon,       color:"#7c3aed", bg:"#f5f3ff",  placeholder:"e.g. 7.5",   max:24    },
  hydration:  { label:"Water",      unit:"ml",       icon:Droplets,   color:"#0891b2", bg:"#ecfeff",  placeholder:"e.g. 2000",  max:5000  },
  nutrition:  { label:"Calories",   unit:"kcal",     icon:Salad,      color:"#059669", bg:"#ecfdf5",  placeholder:"e.g. 1800",  max:5000  },
  stress:     { label:"Stress",     unit:"/10",      icon:Brain,      color:"#dc2626", bg:"#fef2f2",  placeholder:"1-10 scale", max:10    },
  meditation: { label:"Meditation", unit:"min",      icon:Heart,      color:"#d97706", bg:"#fffbeb",  placeholder:"e.g. 20",    max:300   },
};

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-md">
      <div className="mb-1" style={{color:"#94a3b8"}}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="font-medium" style={{color:"#0f172a"}}>{p.value}</span>
          <span style={{color:"#94a3b8"}}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Log modal ───────────────────────────────────────────────────────────── */
function LogModal({ category, onClose }: { category: Category; onClose: () => void }) {
  const qc = useQueryClient();
  const cfg = CAT_CONFIG[category];
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const log = useMutation({
    mutationFn: (body: any) => api.post("/api/wellness", body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.wellness()});
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(15,23,42,.4)",backdropFilter:"blur(8px)"}}>
      <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.96}}
        className="w-full max-w-sm card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:cfg.bg}}>
              <cfg.icon className="w-4.5 h-4.5" style={{color:cfg.color}}/>
            </div>
            <h3 className="font-semibold" style={{color:"#0f172a"}}>Log {cfg.label}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{color:"#94a3b8"}}
            onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); log.mutate({ category, value:parseFloat(value), unit:cfg.unit, notes:notes||null }); }}
          className="space-y-4">
          <div>
            <label className="label">{cfg.label} ({cfg.unit})</label>
            <input type="number" required value={value} onChange={e => setValue(e.target.value)}
              placeholder={cfg.placeholder} min={0} max={cfg.max} step="any" className="field"/>
          </div>
          <div>
            <label className="label">Notes <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span></label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any context or observations" className="field"/>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={log.isPending} className="btn btn-primary flex-1">
              {log.isPending ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving…</> : <><Check className="w-4 h-4"/>Save</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function WellnessPage() {
  const [logCategory, setLogCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<Category>("fitness");

  const { data: entries = [], isLoading } = useQuery<WellnessEntry[]>({
    queryKey: QUERY_KEYS.wellness(),
    queryFn: () => api.get("/api/wellness").then(r => r.data),
    retry: false,
  });

  const tabEntries = entries.filter(e => e.category === activeTab);
  const chartData = tabEntries
    .slice(-14)
    .map(e => ({ date: new Date(e.logged_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}), value: e.value }));

  const latest = tabEntries[tabEntries.length - 1];
  const cfg = CAT_CONFIG[activeTab];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Wellness</h1>
        <p className="text-sm" style={{color:"#64748b"}}>Track fitness, sleep, nutrition, hydration, stress, and meditation</p>
      </motion.div>

      {/* Category overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(Object.entries(CAT_CONFIG) as [Category, typeof CAT_CONFIG[Category]][]).map(([key, c]) => {
          const latestEntry = entries.filter(e => e.category === key).slice(-1)[0];
          const isActive = activeTab === key;
          return (
            <motion.button key={key} onClick={() => setActiveTab(key)}
              className="card p-4 text-left transition-all"
              style={{
                borderColor: isActive ? c.color : "#e2e8f0",
                background: isActive ? c.bg : "white",
                boxShadow: isActive ? `0 0 0 2px ${c.color}33` : undefined,
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{background:"white"}}>
                <c.icon className="w-4.5 h-4.5" style={{color:c.color}}/>
              </div>
              <div className="text-xs font-medium mb-0.5" style={{color:"#64748b"}}>{c.label}</div>
              <div className="text-lg font-bold" style={{color:"#0f172a"}}>
                {latestEntry ? latestEntry.value : "—"}
                {latestEntry && <span className="text-[10px] font-normal ml-1" style={{color:"#94a3b8"}}>{c.unit}</span>}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail panel */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chart */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:cfg.bg}}>
                <cfg.icon className="w-4 h-4" style={{color:cfg.color}}/>
              </div>
              <h2 className="font-semibold" style={{color:"#0f172a"}}>{cfg.label} <span className="text-xs font-normal" style={{color:"#94a3b8"}}>({cfg.unit})</span></h2>
            </div>
            <button onClick={() => setLogCategory(activeTab)} className="btn btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5"/> Log
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="w-5 h-5 animate-spin" style={{color:"#0284c7"}}/>
            </div>
          ) : chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="value" fill={cfg.color} fillOpacity={0.8} radius={[4,4,0,0]} name={cfg.unit}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm" style={{color:"#94a3b8"}}>
              Log {cfg.label.toLowerCase()} to see your trend
            </div>
          )}
        </motion.div>

        {/* Log history */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.06}} className="card p-5">
          <h2 className="font-semibold mb-4 text-sm" style={{color:"#0f172a"}}>Recent logs</h2>
          {tabEntries.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{color:"#e2e8f0"}}/>
              <p className="text-xs" style={{color:"#94a3b8"}}>No {cfg.label.toLowerCase()} logged yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {[...tabEntries].reverse().slice(0,20).map(e => (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{borderColor:"#f8fafc"}}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:cfg.color}}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{color:"#334155"}}>
                      {e.value} <span className="text-xs font-normal" style={{color:"#94a3b8"}}>{cfg.unit}</span>
                    </div>
                    {e.notes && <div className="text-xs truncate" style={{color:"#94a3b8"}}>{e.notes}</div>}
                  </div>
                  <div className="text-xs flex-shrink-0" style={{color:"#94a3b8"}}>
                    {new Date(e.logged_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {logCategory && <LogModal category={logCategory} onClose={() => setLogCategory(null)}/>}
    </div>
  );
}
