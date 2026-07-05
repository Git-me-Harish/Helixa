"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Plus, X, Clock, ChevronDown, ChevronUp, Zap, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface Symptom {
  id: string;
  symptom: string;
  severity: number;
  duration: string | null;
  location: string | null;
  triggers: string[] | null;
  relieving_factors: string[] | null;
  associated_symptoms: string[] | null;
  notes: string | null;
  logged_at: string;
}

const COMMON_SYMPTOMS = [
  "Headache", "Fatigue", "Chest pain", "Shortness of breath", "Nausea",
  "Dizziness", "Fever", "Back pain", "Abdominal pain", "Joint pain",
  "Cough", "Sore throat", "Rash", "Swelling", "Palpitations",
];

const COMMON_TRIGGERS = ["Stress", "Exercise", "Food", "Alcohol", "Lack of sleep", "Weather change", "Medication"];
const COMMON_RELIEVING = ["Rest", "Medication", "Ice/Heat", "Hydration", "Sleep", "Fresh air", "Stretching"];

const EMPTY_FORM = {
  symptom: "", severity: "5", duration: "", location: "",
  triggers: [] as string[], relieving_factors: [] as string[],
  associated_symptoms: "", notes: "",
};

function severityColor(s: number) {
  if (s <= 3) return { text: "#059669", bg: "#ecfdf5", label: "Mild" };
  if (s <= 6) return { text: "#d97706", bg: "#fffbeb", label: "Moderate" };
  if (s <= 8) return { text: "#ea580c", bg: "#fff7ed", label: "Severe" };
  return { text: "#dc2626", bg: "#fef2f2", label: "Critical" };
}

async function fetchSymptoms(): Promise<Symptom[]> {
  const res = await api.get<Symptom[]>("/api/symptoms");
  return res.data;
}

async function logSymptom(data: typeof EMPTY_FORM): Promise<Symptom> {
  const res = await api.post<Symptom>("/api/symptoms", {
    symptom: data.symptom, severity: parseInt(data.severity),
    duration: data.duration || null, location: data.location || null,
    triggers: data.triggers.length > 0 ? data.triggers : null,
    relieving_factors: data.relieving_factors.length > 0 ? data.relieving_factors : null,
    associated_symptoms: data.associated_symptoms
      ? data.associated_symptoms.split(",").map((s: string) => s.trim()).filter(Boolean)
      : null,
    notes: data.notes || null,
  });
  return res.data;
}

async function deleteSymptom(id: string): Promise<void> {
  await api.delete(`/api/symptoms/${id}`);
}

function SeveritySlider({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cfg = severityColor(parseInt(value));
  const pct = ((parseInt(value) - 1) / 9) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">Severity (1–10)</label>
        <span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ background: cfg.bg, color: cfg.text }}>
          {value}/10 — {cfg.label}
        </span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${cfg.text} ${pct}%, #e2e8f0 ${pct}%)` }} />
      <div className="flex justify-between text-xs mt-1" style={{ color: "#94a3b8" }}>
        <span>1 Minimal</span><span>5 Moderate</span><span>10 Unbearable</span>
      </div>
    </div>
  );
}

function LogModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = (k: "triggers" | "relieving_factors", v: string) => {
    setForm(f => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x: string) => x !== v) : [...f[k], v],
    }));
  };

  const mutation = useMutation({
    mutationFn: () => logSymptom(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.symptoms() });
      toast.success("Symptom logged");
      onClose();
    },
    onError: () => toast.error("Failed to log symptom"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .96 }} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-bold text-base" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>Log Symptom</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Symptom *</label>
            <input list="symptom-list" value={form.symptom} onChange={e => set("symptom", e.target.value)}
              placeholder="Describe your symptom" className="field" />
            <datalist id="symptom-list">
              {COMMON_SYMPTOMS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <SeveritySlider value={form.severity} onChange={v => set("severity", v)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duration</label>
              <input value={form.duration} onChange={e => set("duration", e.target.value)}
                placeholder="2 hours, 3 days..." className="field" />
            </div>
            <div>
              <label className="label">Location / Body Part</label>
              <input value={form.location} onChange={e => set("location", e.target.value)}
                placeholder="Left chest, lower back..." className="field" />
            </div>
          </div>
          <div>
            <label className="label">Triggers</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TRIGGERS.map(t => (
                <button key={t} type="button" onClick={() => toggleTag("triggers", t)}
                  className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                  style={{
                    background: form.triggers.includes(t) ? "#0284c7" : "#f8fafc",
                    color: form.triggers.includes(t) ? "white" : "#64748b",
                    borderColor: form.triggers.includes(t) ? "#0284c7" : "#e2e8f0",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Relieving Factors</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_RELIEVING.map(r => (
                <button key={r} type="button" onClick={() => toggleTag("relieving_factors", r)}
                  className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                  style={{
                    background: form.relieving_factors.includes(r) ? "#0d9488" : "#f8fafc",
                    color: form.relieving_factors.includes(r) ? "white" : "#64748b",
                    borderColor: form.relieving_factors.includes(r) ? "#0d9488" : "#e2e8f0",
                  }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Associated Symptoms <span className="font-normal text-[#94a3b8]">(comma-separated)</span></label>
            <input value={form.associated_symptoms} onChange={e => set("associated_symptoms", e.target.value)}
              placeholder="Nausea, dizziness" className="field" />
          </div>
          <div>
            <label className="label">Additional Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
              className="field resize-none" placeholder="Any other details..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={() => form.symptom.trim() && mutation.mutate()}
              disabled={!form.symptom.trim() || mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? "Logging..." : "Log Symptom"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SymptomCard({ symptom, onDelete }: { symptom: Symptom; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityColor(symptom.severity);

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: cfg.bg }}>
          <Activity className="w-5 h-5" style={{ color: cfg.text }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#0f172a" }}>{symptom.symptom}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-sm"
                      style={{ background: i < symptom.severity ? cfg.text : "#e2e8f0" }} />
                  ))}
                </div>
                <span className="text-xs font-medium" style={{ color: cfg.text }}>{symptom.severity}/10</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
              <button onClick={onDelete} className="p-1 rounded-lg" style={{ color: "#94a3b8" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs" style={{ color: "#94a3b8" }}>
              <Clock className="w-3 h-3" /> {formatDateTime(symptom.logged_at)}
            </span>
            {symptom.duration && <span className="text-xs" style={{ color: "#64748b" }}>Duration: {symptom.duration}</span>}
            {symptom.location && <span className="text-xs" style={{ color: "#64748b" }}>Location: {symptom.location}</span>}
          </div>

          {(symptom.triggers || symptom.relieving_factors || symptom.associated_symptoms || symptom.notes) && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs mt-2 font-medium" style={{ color: "#0284c7" }}>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Less" : "More details"}
            </button>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-2 pt-2 space-y-2" style={{ borderTop: "1px solid #f1f5f9" }}>
                  {symptom.triggers && symptom.triggers.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>Triggers</p>
                      <div className="flex flex-wrap gap-1">
                        {symptom.triggers.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#fff7ed", color: "#d97706" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {symptom.relieving_factors && symptom.relieving_factors.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>Relieving Factors</p>
                      <div className="flex flex-wrap gap-1">
                        {symptom.relieving_factors.map(r => (
                          <span key={r} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#ecfdf5", color: "#059669" }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {symptom.notes && <p className="text-xs" style={{ color: "#64748b" }}>{symptom.notes}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function SymptomsPage() {
  const queryClient = useQueryClient();
  const [showLog, setShowLog] = useState(false);

  const { data: symptoms = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.symptoms(), queryFn: fetchSymptoms });

  const deleteMut = useMutation({
    mutationFn: deleteSymptom,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.symptoms() }); toast.success("Entry deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const todayCount = symptoms.filter(s => {
    const d = new Date(s.logged_at);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const avgSeverity = symptoms.length > 0
    ? (symptoms.slice(0, 10).reduce((acc, s) => acc + s.severity, 0) / Math.min(symptoms.length, 10)).toFixed(1)
    : "—";

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Symptom Journal
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Track symptoms, severity, and patterns over time</p>
        </div>
        <div className="flex gap-2">
          <Link href="/chat" className="btn btn-outline btn-sm">
            <MessageSquare className="w-3.5 h-3.5" /> Ask AI
          </Link>
          <button onClick={() => setShowLog(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Log Symptom
          </button>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Logged", value: symptoms.length, color: "#0284c7", bg: "#e0f2fe" },
          { label: "Today", value: todayCount, color: "#0d9488", bg: "#ccfbf1" },
          { label: "Avg Severity (last 10)", value: avgSeverity, color: "#d97706", bg: "#fffbeb" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{label}</div>
          </div>
        ))}
      </div>

      {isLoading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>}

      {!isLoading && symptoms.length === 0 && (
        <div className="card py-16 text-center">
          <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>No symptoms logged</p>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Track your symptoms to identify patterns and share with your doctor.</p>
          <button onClick={() => setShowLog(true)} className="btn btn-primary btn-sm mx-auto">
            <Plus className="w-3.5 h-3.5" /> Log First Symptom
          </button>
        </div>
      )}

      <div className="space-y-3">
        {symptoms.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .03 }}>
            <SymptomCard symptom={s} onDelete={() => deleteMut.mutate(s.id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showLog && <LogModal onClose={() => setShowLog(false)} />}
      </AnimatePresence>
    </div>
  );
}
