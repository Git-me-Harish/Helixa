"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Heart, Activity, Droplets, Thermometer, Plus, Trash2,
  Loader2, X, Pill, ShieldAlert, Clock, AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import type { VitalSign, Medication, Allergy, MedicalHistory } from "@/types";
import { formatDate, vitalStatus } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/queryKeys";

const TABS = ["Vitals", "Medications", "Allergies", "History"] as const;
type Tab = typeof TABS[number];

const fieldCls = "field";

/* ── Chart tooltip ───────────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-xs"
      style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.08)" }}>
      <div className="mb-1.5" style={{ color: "#64748b" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#64748b" }}>{p.name}:</span>
          <span className="font-medium" style={{ color: "#0f172a" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Modal wrapper ───────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ ease: [.16, 1, .3, 1], duration: 0.25 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 20px 60px rgba(15,23,42,0.14)" }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold" style={{ color: "#0f172a" }}>{title}</h3>
          <button
            onClick={onClose}
            className="transition-colors p-1 rounded-md"
            style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
            onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   VITALS TAB
════════════════════════════════════════════════════════════════════════════ */
function VitalsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bp_systolic: "", bp_diastolic: "", heart_rate: "",
    weight_kg: "", height_cm: "", glucose_mmol: "", spo2_pct: "", temp_celsius: "",
  });

  const { data: vitals = [], isLoading } = useQuery<VitalSign[]>({
    queryKey: QUERY_KEYS.vitals(),
    queryFn: () => api.get("/api/records/vitals?limit=90").then(r => r.data),
  });

  const add = useMutation({
    mutationFn: (body: Record<string, number | null>) => api.post("/api/records/vitals", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vitals()});
      qc.invalidateQueries({ queryKey: QUERY_KEYS.healthSummary()});
      setShowForm(false);
      setForm({ bp_systolic: "", bp_diastolic: "", heart_rate: "", weight_kg: "", height_cm: "", glucose_mmol: "", spo2_pct: "", temp_celsius: "" });
    },
    onError: () => toast.error("Failed to save vitals"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/records/vitals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vitals()});
      qc.invalidateQueries({ queryKey: QUERY_KEYS.healthSummary()});
    },
    onError: () => toast.error("Failed to delete vital"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, number | null> = {};
    Object.entries(form).forEach(([k, v]) => { body[k] = v ? Number(v) : null; });
    add.mutate(body);
  };

  const latest = vitals[0];
  const chartData = [...vitals].reverse().map(v => ({
    date: formatDate(v.recorded_at),
    bp_systolic: v.bp_systolic,
    heart_rate: v.heart_rate,
    spo2_pct: v.spo2_pct,
  }));

  /* Map vitalStatus string to light-theme color/bg pairs */
  const statusPalette: Record<string, { color: string; bg: string; border: string }> = {
    normal:   { color: "#059669", bg: "#ecfdf5", border: "#bbf7d0" },
    warning:  { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    unknown:  { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: "#0f172a" }}>Vital Signs</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "#f0fdfa", border: "1px solid #99f6e4", color: "#0d9488" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#ccfbf1")}
          onMouseLeave={e => (e.currentTarget.style.background = "#f0fdfa")}>
          <Plus className="w-3.5 h-3.5" /> Log vitals
        </button>
      </div>

      {/* Latest readings */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Blood Pressure", value: latest.bp_systolic ? `${latest.bp_systolic}/${latest.bp_diastolic}` : null, unit: "mmHg", metric: "bp_systolic", icon: Heart },
            { label: "Heart Rate",     value: latest.heart_rate,   unit: "bpm",  metric: "heart_rate",  icon: Activity },
            { label: "Oxygen Sat",     value: latest.spo2_pct,     unit: "%",    metric: "spo2_pct",    icon: Droplets },
            { label: "Temperature",    value: latest.temp_celsius,  unit: "°C", metric: "temp_celsius", icon: Thermometer },
          ].map(({ label, value, unit, metric, icon: Icon }) => {
            const s = vitalStatus(metric, typeof value === "number" ? value : null);
            const p = statusPalette[s] ?? statusPalette.unknown;
            return (
              <div key={label} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="section-label">{label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ color: p.color }}>{value ?? "—"}</div>
                <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{unit}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium mb-4" style={{ color: "#64748b" }}>Vital trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="bp_systolic" stroke="#0d9488" strokeWidth={1.5} dot={false} name="Systolic" />
              <Line type="monotone" dataKey="heart_rate"  stroke="#0284c7" strokeWidth={1.5} dot={false} name="Heart Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Date", "BP (mmHg)", "HR (bpm)", "Weight (kg)", "SpO₂ (%)", "Glucose", "Temp (°C)", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left section-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "#0d9488" }} />
                  </td>
                </tr>
              )}
              {!isLoading && vitals.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-sm" style={{ color: "#94a3b8" }}>
                    No vitals logged yet
                  </td>
                </tr>
              )}
              {vitals.map((v, i) => (
                <tr
                  key={v.id}
                  style={{ borderBottom: i < vitals.length - 1 ? "1px solid #f1f5f9" : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-4 py-3" style={{ color: "#64748b" }}>{formatDate(v.recorded_at)}</td>
                  <td className="px-4 py-3" style={{ color: "#0f172a" }}>{v.bp_systolic ? `${v.bp_systolic}/${v.bp_diastolic}` : "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#0f172a" }}>{v.heart_rate ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#0f172a" }}>{v.weight_kg ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#0f172a" }}>{v.spo2_pct ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#0f172a" }}>{v.glucose_mmol ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#0f172a" }}>{v.temp_celsius ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove.mutate(v.id)}
                      className="transition-colors p-1"
                      style={{ color: "#cbd5e1" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add vitals modal */}
      <AnimatePresence>
        {showForm && (
          <Modal title="Log Vital Signs" onClose={() => setShowForm(false)}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "bp_systolic",  label: "Systolic BP",   placeholder: "120", unit: "mmHg" },
                  { key: "bp_diastolic", label: "Diastolic BP",  placeholder: "80",  unit: "mmHg" },
                  { key: "heart_rate",   label: "Heart Rate",    placeholder: "70",  unit: "bpm"  },
                  { key: "spo2_pct",     label: "SpO₂",     placeholder: "98",  unit: "%"    },
                  { key: "weight_kg",    label: "Weight",        placeholder: "70",  unit: "kg"   },
                  { key: "temp_celsius", label: "Temperature",   placeholder: "37",  unit: "°C" },
                  { key: "glucose_mmol", label: "Blood Glucose", placeholder: "5.5", unit: "mmol/L" },
                  { key: "height_cm",    label: "Height",        placeholder: "170", unit: "cm"   },
                ].map(({ key, label, placeholder, unit }) => (
                  <div key={key}>
                    <label className="label">
                      {label} <span style={{ color: "#94a3b8" }}>({unit})</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={fieldCls}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={add.isPending} className="btn-primary flex-1 py-2.5">
                  {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MEDICATIONS TAB
════════════════════════════════════════════════════════════════════════════ */
function MedicationsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", generic_name: "", dosage: "", unit: "mg", frequency: "", route: "oral", prescriber: "" });

  const { data: meds = [] } = useQuery<Medication[]>({
    queryKey: QUERY_KEYS.medications(),
    queryFn: () => api.get("/api/records/medications").then(r => r.data),
  });

  const add = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/records/medications", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.medications()});
      qc.invalidateQueries({ queryKey: QUERY_KEYS.healthSummary()});
      setShowForm(false);
      setForm({ name: "", generic_name: "", dosage: "", unit: "mg", frequency: "", route: "oral", prescriber: "" });
    },
    onError: () => toast.error("Failed to save medication"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/records/medications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.medications()});
      qc.invalidateQueries({ queryKey: QUERY_KEYS.healthSummary()});
    },
    onError: () => toast.error("Failed to delete medication"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: "#0f172a" }}>Medications</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 px-3.5 py-2 text-sm">
          <Plus className="w-3.5 h-3.5" /> Add medication
        </button>
      </div>

      {meds.length === 0 && (
        <div className="card px-4 py-10 text-center text-sm" style={{ color: "#94a3b8" }}>
          No medications recorded
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {meds.map(m => (
          <div key={m.id} className="card p-4 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#ecfdf5", border: "1px solid #bbf7d0" }}>
                  <Pill className="w-4 h-4" style={{ color: "#059669" }} />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{m.name}</div>
                  {m.generic_name && <div className="text-xs" style={{ color: "#64748b" }}>{m.generic_name}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={m.is_active ? "badge badge-pos" : "badge badge-neutral"}>
                  {m.is_active ? "Active" : "Stopped"}
                </span>
                <button
                  onClick={() => remove.mutate(m.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all p-1"
                  style={{ color: "#cbd5e1" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-xs space-y-0.5" style={{ color: "#64748b" }}>
              {m.dosage    && <div><span style={{ color: "#0f172a" }}>Dosage</span> · {m.dosage} {m.unit}</div>}
              {m.frequency && <div><span style={{ color: "#0f172a" }}>Frequency</span> · {m.frequency}</div>}
              {m.prescriber && <div><span style={{ color: "#0f172a" }}>Prescriber</span> · {m.prescriber}</div>}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal title="Add Medication" onClose={() => setShowForm(false)}>
            <form onSubmit={e => { e.preventDefault(); add.mutate(form); }} className="space-y-3.5">
              {[
                { key: "name",         label: "Medication name", required: true,  placeholder: "Metformin" },
                { key: "generic_name", label: "Generic name",    required: false, placeholder: "metformin HCl" },
                { key: "dosage",       label: "Dosage",          required: true,  placeholder: "500" },
                { key: "frequency",    label: "Frequency",       required: true,  placeholder: "Twice daily" },
                { key: "prescriber",   label: "Prescriber",      required: false, placeholder: "Dr. Smith" },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={fieldCls}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={add.isPending} className="btn-primary flex-1 py-2.5">
                  {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ALLERGIES TAB
════════════════════════════════════════════════════════════════════════════ */
function AllergiesTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ substance: "", severity: "mild", reaction_type: "" });

  const { data: allergies = [] } = useQuery<Allergy[]>({
    queryKey: QUERY_KEYS.allergies(),
    queryFn: () => api.get("/api/records/allergies").then(r => r.data),
  });

  const add = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/records/allergies", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allergies()});
      setShowForm(false);
      setForm({ substance: "", severity: "mild", reaction_type: "" });
    },
    onError: () => toast.error("Failed to save allergy"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/records/allergies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.allergies()}),
    onError: () => toast.error("Failed to delete allergy"),
  });

  /* Severity mapped to light design-system badge styles */
  const severityStyle: Record<string, { bg: string; border: string; color: string }> = {
    mild:             { bg: "#ecfdf5", border: "#bbf7d0", color: "#059669" },
    moderate:         { bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
    severe:           { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
    life_threatening: { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: "#0f172a" }}>Allergies</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fef2f2")}>
          <Plus className="w-3.5 h-3.5" /> Add allergy
        </button>
      </div>

      {allergies.length === 0 && (
        <div className="card px-4 py-10 text-center text-sm" style={{ color: "#94a3b8" }}>
          No allergies recorded
        </div>
      )}

      <div className="space-y-2">
        {allergies.map(a => {
          const sc = severityStyle[a.severity] ?? severityStyle.mild;
          return (
            <div key={a.id} className="card px-4 py-3.5 flex items-center gap-4 group">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <ShieldAlert className="w-4 h-4" style={{ color: "#dc2626" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{a.substance}</div>
                {a.reaction_type && <div className="text-xs" style={{ color: "#64748b" }}>{a.reaction_type}</div>}
              </div>
              <span
                className="badge capitalize"
                style={{ background: sc.bg, borderColor: sc.border, borderWidth: "1px", borderStyle: "solid", color: sc.color }}>
                {a.severity.replace("_", " ")}
              </span>
              <button
                onClick={() => remove.mutate(a.id)}
                className="opacity-0 group-hover:opacity-100 transition-all p-1"
                style={{ color: "#cbd5e1" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal title="Add Allergy" onClose={() => setShowForm(false)}>
            <form onSubmit={e => { e.preventDefault(); add.mutate(form); }} className="space-y-3.5">
              <div>
                <label className="label">Substance / Allergen</label>
                <input
                  required
                  value={form.substance}
                  onChange={e => setForm(f => ({ ...f, substance: e.target.value }))}
                  placeholder="Penicillin"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="label">Severity</label>
                <select
                  value={form.severity}
                  onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className={fieldCls}>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life_threatening">Life Threatening</option>
                </select>
              </div>
              <div>
                <label className="label">Reaction type</label>
                <input
                  value={form.reaction_type}
                  onChange={e => setForm(f => ({ ...f, reaction_type: e.target.value }))}
                  placeholder="Anaphylaxis, rash..."
                  className={fieldCls}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={add.isPending} className="btn-primary flex-1 py-2.5">
                  {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HISTORY TAB
════════════════════════════════════════════════════════════════════════════ */
function HistoryTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ condition: "", icd10_code: "", status: "active", notes: "" });

  const { data: history = [] } = useQuery<MedicalHistory[]>({
    queryKey: QUERY_KEYS.medicalHistory(),
    queryFn: () => api.get("/api/records/history").then(r => r.data),
  });

  const add = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/records/history", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.medicalHistory()});
      setShowForm(false);
      setForm({ condition: "", icd10_code: "", status: "active", notes: "" });
    },
    onError: () => toast.error("Failed to save condition"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/records/history/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.medicalHistory()}),
    onError: () => toast.error("Failed to delete condition"),
  });

  const historyStatusStyle: Record<string, { bg: string; border: string; color: string }> = {
    active:    { bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
    resolved:  { bg: "#ecfdf5", border: "#bbf7d0", color: "#059669" },
    chronic:   { bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
    remission: { bg: "#f0fdfa", border: "#99f6e4", color: "#0d9488" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: "#0f172a" }}>Medical History</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#dbeafe")}
          onMouseLeave={e => (e.currentTarget.style.background = "#eff6ff")}>
          <Plus className="w-3.5 h-3.5" /> Add condition
        </button>
      </div>

      {history.length === 0 && (
        <div className="card px-4 py-10 text-center text-sm" style={{ color: "#94a3b8" }}>
          No medical history recorded
        </div>
      )}

      <div className="space-y-2">
        {history.map(h => {
          const sc = historyStatusStyle[h.status] ?? historyStatusStyle.active;
          return (
            <div key={h.id} className="card px-4 py-3.5 flex items-center gap-4 group">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <Clock className="w-4 h-4" style={{ color: "#2563eb" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{h.condition}</div>
                <div className="text-xs" style={{ color: "#64748b" }}>
                  {h.icd10_code && `ICD-10: ${h.icd10_code}`}
                  {h.notes && (h.icd10_code ? " · " : "") + h.notes}
                </div>
              </div>
              <span
                className="badge capitalize"
                style={{ background: sc.bg, borderColor: sc.border, borderWidth: "1px", borderStyle: "solid", color: sc.color }}>
                {h.status}
              </span>
              <button
                onClick={() => remove.mutate(h.id)}
                className="opacity-0 group-hover:opacity-100 transition-all p-1"
                style={{ color: "#cbd5e1" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal title="Add Condition" onClose={() => setShowForm(false)}>
            <form onSubmit={e => { e.preventDefault(); add.mutate(form); }} className="space-y-3.5">
              <div>
                <label className="label">Condition</label>
                <input
                  required
                  value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  placeholder="Type 2 Diabetes Mellitus"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="label">
                  ICD-10 Code <span style={{ color: "#94a3b8" }}>(optional)</span>
                </label>
                <input
                  value={form.icd10_code}
                  onChange={e => setForm(f => ({ ...f, icd10_code: e.target.value }))}
                  placeholder="E11.9"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className={fieldCls}>
                  <option value="active">Active</option>
                  <option value="chronic">Chronic</option>
                  <option value="resolved">Resolved</option>
                  <option value="remission">Remission</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className={`${fieldCls} resize-none`}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5">Cancel</button>
                <button type="submit" disabled={add.isPending} className="btn-primary flex-1 py-2.5">
                  {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════════════════ */
export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Vitals");

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#0f172a" }}>Health Records</h1>
        <p className="text-sm" style={{ color: "#64748b" }}>Manage your complete health history</p>
      </motion.div>

      {/* Tab switcher */}
      <div
        className="flex gap-0.5 mb-7 p-1 rounded-xl w-fit"
        style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background:  activeTab === tab ? "#0284c7" : "transparent",
              border:      activeTab === tab ? "1px solid #0284c7" : "1px solid transparent",
              color:       activeTab === tab ? "#ffffff" : "#64748b",
            }}>
            {tab}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === "Vitals"      && <VitalsTab />}
        {activeTab === "Medications" && <MedicationsTab />}
        {activeTab === "Allergies"   && <AllergiesTab />}
        {activeTab === "History"     && <HistoryTab />}
      </motion.div>
    </div>
  );
}
