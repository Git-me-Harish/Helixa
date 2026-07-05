"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Plus, X, Edit2, Phone, Calendar, DollarSign, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

interface Insurance {
  id: string;
  insurance_type: "primary" | "secondary" | "dental" | "vision" | "life";
  provider_name: string;
  policy_number: string;
  group_number: string | null;
  member_id: string | null;
  subscriber_name: string | null;
  subscriber_relationship: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  copay: number | null;
  deductible: number | null;
  phone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const TYPE_CONFIG = {
  primary:   { label: "Primary Medical",  color: "#0284c7", bg: "#e0f2fe", border: "#bfdbfe" },
  secondary: { label: "Secondary Medical", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  dental:    { label: "Dental",            color: "#0d9488", bg: "#ccfbf1", border: "#99f6e4" },
  vision:    { label: "Vision",            color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  life:      { label: "Life Insurance",    color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
};

const EMPTY_FORM = {
  insurance_type: "primary", provider_name: "", policy_number: "",
  group_number: "", member_id: "", subscriber_name: "", subscriber_relationship: "",
  effective_date: "", expiry_date: "", copay: "", deductible: "", phone: "",
  is_active: true, notes: "",
};

async function fetchInsurance(): Promise<Insurance[]> {
  const res = await api.get<Insurance[]>("/api/insurance");
  return res.data;
}

async function saveInsurance(data: typeof EMPTY_FORM, id?: string): Promise<Insurance> {
  const body = {
    ...data,
    group_number: data.group_number || null,
    member_id: data.member_id || null,
    subscriber_name: data.subscriber_name || null,
    subscriber_relationship: data.subscriber_relationship || null,
    effective_date: data.effective_date || null,
    expiry_date: data.expiry_date || null,
    copay: data.copay ? parseFloat(data.copay) : null,
    deductible: data.deductible ? parseFloat(data.deductible) : null,
    phone: data.phone || null,
    notes: data.notes || null,
  };
  const res = id
    ? await api.put<Insurance>(`/api/insurance/${id}`, body)
    : await api.post<Insurance>("/api/insurance", body);
  return res.data;
}

async function deleteInsurance(id: string): Promise<void> {
  await api.delete(`/api/insurance/${id}`);
}

function InsuranceModal({ policy, onClose }: { policy?: Insurance; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(policy ? {
    insurance_type: policy.insurance_type,
    provider_name: policy.provider_name,
    policy_number: policy.policy_number,
    group_number: policy.group_number ?? "",
    member_id: policy.member_id ?? "",
    subscriber_name: policy.subscriber_name ?? "",
    subscriber_relationship: policy.subscriber_relationship ?? "",
    effective_date: policy.effective_date?.split("T")[0] ?? "",
    expiry_date: policy.expiry_date?.split("T")[0] ?? "",
    copay: policy.copay?.toString() ?? "",
    deductible: policy.deductible?.toString() ?? "",
    phone: policy.phone ?? "",
    is_active: policy.is_active,
    notes: policy.notes ?? "",
  } : EMPTY_FORM);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => saveInsurance(form as typeof EMPTY_FORM, policy?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.insurance() });
      toast.success(policy ? "Policy updated" : "Policy added");
      onClose();
    },
    onError: () => toast.error("Failed to save"),
  });

  const valid = form.provider_name.trim() && form.policy_number.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .96 }} className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <h2 className="font-bold text-base" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            {policy ? "Edit Insurance" : "Add Insurance Policy"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Insurance Type *</label>
            <select value={form.insurance_type} onChange={e => set("insurance_type", e.target.value)} className="field">
              {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Provider Name *</label>
              <input value={form.provider_name} onChange={e => set("provider_name", e.target.value)}
                placeholder="Blue Cross Blue Shield" className="field" />
            </div>
            <div>
              <label className="label">Policy Number *</label>
              <input value={form.policy_number} onChange={e => set("policy_number", e.target.value)}
                placeholder="XYZ123456" className="field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Group Number</label>
              <input value={form.group_number} onChange={e => set("group_number", e.target.value)}
                placeholder="GRP001" className="field" />
            </div>
            <div>
              <label className="label">Member ID</label>
              <input value={form.member_id} onChange={e => set("member_id", e.target.value)}
                placeholder="MBR001" className="field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Subscriber Name</label>
              <input value={form.subscriber_name} onChange={e => set("subscriber_name", e.target.value)}
                placeholder="John Doe" className="field" />
            </div>
            <div>
              <label className="label">Subscriber Relationship</label>
              <input value={form.subscriber_relationship} onChange={e => set("subscriber_relationship", e.target.value)}
                placeholder="Self / Spouse" className="field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Effective Date</label>
              <input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="field" />
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} className="field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Copay ($)</label>
              <input type="number" min={0} step={0.01} value={form.copay} onChange={e => set("copay", e.target.value)}
                placeholder="25.00" className="field" />
            </div>
            <div>
              <label className="label">Annual Deductible ($)</label>
              <input type="number" min={0} step={0.01} value={form.deductible} onChange={e => set("deductible", e.target.value)}
                placeholder="1500.00" className="field" />
            </div>
          </div>
          <div>
            <label className="label">Provider Phone</label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              placeholder="1-800-555-0100" className="field" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Additional coverage notes..." className="field resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
            <button onClick={() => valid && mutation.mutate()} disabled={!valid || mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? "Saving..." : policy ? "Update" : "Add Policy"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PolicyCard({ policy, onEdit, onDelete }: { policy: Insurance; onEdit: () => void; onDelete: () => void }) {
  const cfg = TYPE_CONFIG[policy.insurance_type] ?? TYPE_CONFIG.primary;
  const isExpired = policy.expiry_date && new Date(policy.expiry_date) < new Date();

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
            <ShieldCheck className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "#0f172a" }}>{policy.provider_name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              {cfg.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {policy.is_active && !isExpired ? (
            <span className="flex items-center gap-1 text-xs" style={{ color: "#059669" }}>
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs" style={{ color: "#dc2626" }}>
              <XCircle className="w-3 h-3" /> {isExpired ? "Expired" : "Inactive"}
            </span>
          )}
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

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {policy.policy_number && (
          <div><span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Policy #</span>
            <p className="text-sm font-mono" style={{ color: "#334155" }}>{policy.policy_number}</p></div>
        )}
        {policy.group_number && (
          <div><span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Group #</span>
            <p className="text-sm font-mono" style={{ color: "#334155" }}>{policy.group_number}</p></div>
        )}
        {policy.member_id && (
          <div><span className="text-xs font-medium" style={{ color: "#94a3b8" }}>Member ID</span>
            <p className="text-sm font-mono" style={{ color: "#334155" }}>{policy.member_id}</p></div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
        {policy.effective_date && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748b" }}>
            <Calendar className="w-3 h-3" /> {formatDate(policy.effective_date)}
            {policy.expiry_date && <> — {formatDate(policy.expiry_date)}</>}
          </div>
        )}
        {policy.copay !== null && (
          <div className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
            <DollarSign className="w-3 h-3" /> Copay: ${policy.copay}
          </div>
        )}
        {policy.deductible !== null && (
          <div className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
            <DollarSign className="w-3 h-3" /> Deductible: ${policy.deductible.toLocaleString()}
          </div>
        )}
        {policy.phone && (
          <div className="flex items-center gap-1 text-xs" style={{ color: "#0284c7" }}>
            <Phone className="w-3 h-3" />
            <a href={`tel:${policy.phone}`}>{policy.phone}</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InsurancePage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; policy?: Insurance }>({ open: false });

  const { data: policies = [], isLoading } = useQuery({ queryKey: QUERY_KEYS.insurance(), queryFn: fetchInsurance });

  const deleteMut = useMutation({
    mutationFn: deleteInsurance,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.insurance() }); toast.success("Policy removed"); },
    onError: () => toast.error("Failed to remove"),
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0f172a", fontFamily: "Plus Jakarta Sans,sans-serif" }}>
            Insurance & Coverage
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>Manage your health insurance policies and coverage details</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </motion.div>

      {isLoading && <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-44 rounded-xl" />)}</div>}

      {!isLoading && policies.length === 0 && (
        <div className="card py-16 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-medium mb-1" style={{ color: "#64748b" }}>No insurance policies</p>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Add your health insurance information for complete coverage tracking.</p>
          <button onClick={() => setModal({ open: true })} className="btn btn-primary btn-sm mx-auto">
            <Plus className="w-3.5 h-3.5" /> Add Policy
          </button>
        </div>
      )}

      <div className="space-y-4">
        {policies.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
            <PolicyCard policy={p} onEdit={() => setModal({ open: true, policy: p })} onDelete={() => deleteMut.mutate(p.id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal.open && <InsuranceModal policy={modal.policy} onClose={() => setModal({ open: false })} />}
      </AnimatePresence>
    </div>
  );
}
