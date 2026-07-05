"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Plus, X, Edit2, Calendar, User, CheckCircle, Clock, PauseCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface TreatmentPlan {
  id: string;
  title: string;
  condition: string;
  prescribing_provider: string | null;
  start_date: string;
  end_date: string | null;
  status: "active" | "completed" | "paused" | "discontinued";
  goals: string[] | null;
  interventions: string[] | null;
  medications: string[] | null;
  progress_notes: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  active:       { label: "Active",        icon: CheckCircle, text: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  completed:    { label: "Completed",     icon: CheckCircle, text: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  paused:       { label: "Paused",        icon: PauseCircle, text: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  discontinued: { label: "Discontinued",  icon: XCircle,     text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const parseList = (s: string): string[] | null => {
  const arr = s.split("\n").map((x: string) => x.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
};

const EMPTY_FORM = {
  title: "", condition: "", prescribing_provider: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "", status: "active",
  goals: "", interventions: "", medications: "",
  progress_notes: "", next_review_date: "",
};

async function fetchPlans(): Promise<TreatmentPlan[]> {
  const res = await api.get<TreatmentPlan[]>("/api/treatment-plans");
  return res.data;
}

async function savePlan(data: typeof EMPTY_FORM, id?: string): Promise<TreatmentPlan> {
  const body = {
    title: data.title, condition: data.condition,
    prescribing_provider: data.prescribing_provider || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    status: data.status,
    goals: parseList(data.goals),
    interventions: parseList(data.interventions),
    medications: parseList(data.medications),
    progress_notes: data.progress_notes || null,
    next_review_date: data.next_review_date || null,
  };
  const res = id
    ? await api.put<TreatmentPlan>(`/api/treatment-plans/${id}`, body)
    : await api.post<TreatmentPlan>("/api/treatment-plans", body);
  return res.data;
}

async function deletePlan(id: string): Promise<void> {
  await api.delete(`/api/treatment-plans/${id}`);
}

function PlanModal({ plan, onClose }: { plan?: TreatmentPlan; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(plan ? {
    title: plan.title, condition: plan.condition,
    prescribing_provider: plan.prescribing_provider ?? "",
    start_date: plan.start_date?.split("T")[0] ?? "",
    end_date: plan.end_date?.split("T")[0] ?? "",
    status: plan.status,
    goals: (plan.goals ?? []).join("\n"),
    interventions: (plan.interventions ?? []).join("\n"),
    medications: (plan.medications ?? []).join("\n"),
    progress_notes: plan.progress_notes ?? "",
    next_review_date: plan.next_review_date?.split("T")[0] ?? "",
  } : EMPTY_FORM);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => savePlan(form, plan?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.treatmentPlans() });
      toast.success(plan ? "Plan updated" : "Plan created");
      onClose();
    },
    onError: () => toast.error("Failed to save"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .96 }} className="card w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-bold text-base" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            {plan ? "Edit Treatment Plan" : "New Treatment Plan"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Plan Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. Type 2 Diabetes Management" className="field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Condition *</label>
              <input value={form.condition} onChange={e => set("condition", e.target.value)}
                placeholder="Diabetes Mellitus Type 2" className="field" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className="field">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Prescribing Provider</label>
            <input value={form.prescribing_provider} onChange={e => set("prescribing_provider", e.target.value)}
              placeholder="Dr. Jane Smith" className="field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="field" />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="field" />
            </div>
          </div>
          <div>
            <label className="label">Goals <span className="font-normal text-[#94a3b8]">(one per line)</span></label>
            <textarea rows={3} value={form.goals} onChange={e => set("goals", e.target.value)}
              placeholder={"Reduce HbA1c below 7%\nAchieve weight loss of 5kg\nDaily glucose monitoring"} className="field resize-none" />
          </div>
          <div>
            <label className="label">Interventions <span className="font-normal text-[#94a3b8]">(one per line)</span></label>
            <textarea rows={3} value={form.interventions} onChange={e => set("interventions", e.target.value)}
              placeholder={"Diet modification\n30 min daily exercise\nMonthly check-in"} className="field resize-none" />
          </div>
          <div>
            <label className="label">Medications <span className="font-normal text-[#94a3b8]">(one per line)</span></label>
            <textarea rows={2} value={form.medications} onChange={e => set("medications", e.target.value)}
              placeholder={"Metformin 500mg twice daily\nLisinopril 10mg once daily"} className="field resize-none" />
          </div>
          <div>
            <label className="label">Progress Notes</label>
            <textarea rows={2} value={form.progress_notes} onChange={e => set("progress_notes", e.target.value)}
              className="field resize-none" placeholder="Latest progress or updates..." />
          </div>
          <div>
            <label className="label">Next Review Date</label>
            <input type="date" value={form.next_review_date} onChange={e => set("next_review_date", e.target.value)} className="field" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={() => form.title.trim() && form.condition.trim() && mutation.mutate()}
              disabled={!form.title.trim() || !form.condition.trim() || mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PlanCard({ plan, onEdit, onDelete }: { plan: TreatmentPlan; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[plan.status];
  const Icon = cfg.icon;
  const hasDetails = plan.goals || plan.interventions || plan.medications || plan.progress_notes;

  return (
    <div className="card p-5" style={{ borderLeft: `4px solid ${cfg.text}` }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold" style={{ color: "#0f172a" }}>{plan.title}</h3>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
              <Icon className="w-3 h-3" />{cfg.label}
            </span>
          </div>
          <p className="text-sm" style={{ color: "#64748b" }}>{plan.condition}</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={onEdit} className="p-1.5 rounded-lg" style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0284c7"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}>
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-2">
        <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
          <Calendar className="w-3 h-3" /> Started {formatDate(plan.start_date)}
        </span>
        {plan.end_date && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
            <Calendar className="w-3 h-3" /> Ends {formatDate(plan.end_date)}
          </span>
        )}
        {plan.next_review_date && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "#d97706" }}>
            <Clock className="w-3 h-3" /> Review {formatDate(plan.next_review_date)}
          </span>
        )}
        {plan.prescribing_provider && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
            <User className="w-3 h-3" /> {plan.prescribing_provider}
          </span>
        )}
      </div>

      {hasDetails && (
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs mt-3 font-medium" style={{ color: "#0284c7" }}>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Collapse" : "View details"}
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
              {plan.goals && plan.goals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#059669" }}>Goals</p>
                  <ul className="space-y-1">
                    {plan.goals.map((g, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "#334155" }}>
                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#059669" }} />{g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.interventions && plan.interventions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#0284c7" }}>Interventions</p>
                  <ul className="space-y-1">
                    {plan.interventions.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "#334155" }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#0284c7" }} />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.medications && plan.medications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#d97706" }}>Medications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.medications.map((m, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-md"
                        style={{ background: "#fffbeb", color: "#d97706" }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {plan.progress_notes && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Progress Notes</p>
                  <p className="text-xs" style={{ color: "#334155" }}>{plan.progress_notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TreatmentPlansPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; plan?: TreatmentPlan }>({ open: false });
  const [filter, setFilter] = useState("all");

  const { data: plans = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.treatmentPlans(), queryFn: fetchPlans });

  const deleteMut = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.treatmentPlans() }); toast.success("Plan deleted"); },
    onError: () => toast.error("Failed to delete"),
  });

  const filtered = filter === "all" ? plans : plans.filter(p => p.status === filter);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Treatment Plans
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Track ongoing and completed treatment protocols</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#f1f5f9" }}>
        {[
          { key: "all", label: "All" },
          ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === key ? "white" : "transparent",
              color: filter === key ? "#0f172a" : "#64748b",
              boxShadow: filter === key ? "0 1px 3px rgba(15,23,42,.1)" : "none",
            }}>
            {label} ({key === "all" ? plans.length : plans.filter(p => p.status === key).length})
          </button>
        ))}
      </div>

      {isLoading && <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="card py-16 text-center">
          <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>
            {filter === "all" ? "No treatment plans yet" : `No ${filter} plans`}
          </p>
          {filter === "all" && (
            <>
              <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Create treatment plans to track your healthcare protocols.</p>
              <button onClick={() => setModal({ open: true })} className="btn btn-primary btn-sm mx-auto">
                <Plus className="w-3.5 h-3.5" /> New Plan
              </button>
            </>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
            <PlanCard plan={p} onEdit={() => setModal({ open: true, plan: p })} onDelete={() => deleteMut.mutate(p.id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal.open && <PlanModal plan={modal.plan} onClose={() => setModal({ open: false })} />}
      </AnimatePresence>
    </div>
  );
}
