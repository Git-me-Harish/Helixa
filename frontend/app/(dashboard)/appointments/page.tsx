"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Clock, Plus, Trash2, X, Loader2, Bot,
  ChevronDown, CheckCircle, XCircle
} from "lucide-react";
import api from "@/lib/api";
import type { Appointment } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/queryKeys";

const STATUS_CFG: Record<string, { label:string; color:string; bg:string; border:string; icon:React.ElementType }> = {
  pending:   { label:"Pending",   color:"#d97706", bg:"#fffbeb", border:"#fde68a",  icon:Clock },
  confirmed: { label:"Confirmed", color:"#0284c7", bg:"#e0f2fe", border:"#bae6fd",  icon:CheckCircle },
  completed: { label:"Completed", color:"#059669", bg:"#ecfdf5", border:"#a7f3d0",  icon:CheckCircle },
  cancelled: { label:"Cancelled", color:"#dc2626", bg:"#fef2f2", border:"#fecaca",  icon:XCircle },
};

const fieldCls = "field";

/* -- Appointment card ----------------------------------------------------- */
function AppointmentCard({ appt }: { appt: Appointment }) {
  const qc = useQueryClient();
  const [showPrep, setShowPrep] = useState(false);
  const cfg = STATUS_CFG[appt.status] ?? STATUS_CFG.pending;
  const Icon = cfg.icon;
  const dt = new Date(appt.appointment_dt);
  const isPast = dt < new Date();

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/api/appointments/${appt.id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.appointments()}),
    onError: () => toast.error("Failed to update appointment status"),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/api/appointments/${appt.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.appointments()}),
    onError: () => toast.error("Failed to cancel appointment"),
  });

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{ease:[.16,1,.3,1]}}
      className="rounded-2xl overflow-hidden"
      style={{
        background:"#ffffff",
        border:"1px solid #e2e8f0",
        opacity: isPast && appt.status === "pending" ? 0.5 : 1,
      }}>

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
            style={{background:"#e0f2fe",border:"1px solid #bae6fd"}}>
            <span className="text-lg font-bold leading-none" style={{color:"#0284c7"}}>{dt.getDate()}</span>
            <span className="text-[10px]" style={{color:"#0284c7"}}>
              {dt.toLocaleString("default",{month:"short"})}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium" style={{color:"#0f172a"}}>{appt.doctor_name}</div>
                {appt.speciality && <div className="text-sm" style={{color:"#64748b"}}>{appt.speciality}</div>}
              </div>
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                style={{background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color}}>
                <Icon className="w-3 h-3"/>{cfg.label}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs" style={{color:"#64748b"}}>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3"/>
                {dt.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
              </span>
              {appt.notes && <span className="truncate max-w-xs">{appt.notes}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3"
          style={{borderTop:"1px solid #f1f5f9"}}>
          {appt.ai_prep_notes && (
            <button onClick={() => setShowPrep(!showPrep)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{color:"#0284c7"}}
              onMouseEnter={e=>(e.currentTarget.style.opacity="0.7")}
              onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              <Bot className="w-3.5 h-3.5"/>
              AI prep notes
              <ChevronDown className={`w-3 h-3 transition-transform ${showPrep?"rotate-180":""}`}/>
            </button>
          )}
          <div className="flex-1"/>

          {appt.status === "pending" && (
            <button onClick={() => updateStatus.mutate("confirmed")}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{background:"transparent",border:"1px solid #0284c7",color:"#0284c7"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#e0f2fe"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent"}}>
              Confirm
            </button>
          )}
          {appt.status !== "completed" && appt.status !== "cancelled" && (
            <button onClick={() => updateStatus.mutate("completed")}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{background:"transparent",border:"1px solid #059669",color:"#059669"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="#ecfdf5"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent"}}>
              Complete
            </button>
          )}
          <button onClick={() => remove.mutate()} disabled={remove.isPending}
            className="ml-1 p-1 transition-colors" style={{color:"#94a3b8"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#dc2626")}
            onMouseLeave={e=>(e.currentTarget.style.color="#94a3b8")}>
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>

      {/* AI prep notes */}
      <AnimatePresence>
        {showPrep && appt.ai_prep_notes && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            className="overflow-hidden">
            <div className="px-4 pb-4" style={{borderTop:"1px solid #bfdbfe",background:"#f0f9ff"}}>
              <div className="pt-4 flex items-center gap-2 mb-2.5 text-xs font-medium" style={{color:"#0284c7"}}>
                <Bot className="w-3.5 h-3.5"/>
                AI-Generated Appointment Preparation
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{color:"#334155"}}>
                {appt.ai_prep_notes}
              </p>
              <p className="text-xs mt-2" style={{color:"#64748b"}}>
                AI-generated guidance only — consult your provider for medical decisions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* -- New appointment modal ------------------------------------------------ */
function NewAppointmentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ doctor_name:"", speciality:"", appointment_dt:"", notes:"" });

  const create = useMutation({
    mutationFn: (body: typeof form) => api.post("/api/appointments", body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.appointments()}); onClose(); },
    onError: () => toast.error("Failed to book appointment"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(15,23,42,0.4)",backdropFilter:"blur(8px)"}}>
      <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
        transition={{ease:[.16,1,.3,1],duration:0.25}}
        className="w-full max-w-md rounded-2xl p-6"
        style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold" style={{color:"#0f172a"}}>Book Appointment</h3>
          <button onClick={onClose} className="p-1 rounded-md transition-colors"
            style={{color:"#64748b"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#0f172a")}
            onMouseLeave={e=>(e.currentTarget.style.color="#64748b")}>
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div>
            <label className="label">Doctor / Provider</label>
            <input required value={form.doctor_name}
              onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
              placeholder="Dr. Jane Smith" className={fieldCls}/>
          </div>
          <div>
            <label className="label">Speciality <span style={{color:"#94a3b8"}}>(optional)</span></label>
            <input value={form.speciality}
              onChange={e => setForm(f => ({ ...f, speciality: e.target.value }))}
              placeholder="Cardiology, General Practice..." className={fieldCls}/>
          </div>
          <div>
            <label className="label">Date &amp; Time</label>
            <input required type="datetime-local" value={form.appointment_dt}
              onChange={e => setForm(f => ({ ...f, appointment_dt: e.target.value }))}
              className={fieldCls}/>
          </div>
          <div>
            <label className="label">Notes <span style={{color:"#94a3b8"}}>(optional)</span></label>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Reason for visit, symptoms to discuss..."
              rows={3} className={`${fieldCls} resize-none`}/>
          </div>

          {create.isPending && (
            <div className="flex items-center gap-2 text-xs" style={{color:"#0284c7"}}>
              <Loader2 className="w-3.5 h-3.5 animate-spin"/>
              Booking &amp; generating AI prep notes...
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1 py-2.5">
              {create.isPending ? <><Loader2 className="w-4 h-4 animate-spin"/> Booking...</> : "Book Appointment"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* -- Page ----------------------------------------------------------------- */
const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

export default function AppointmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState<string>("all");

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: QUERY_KEYS.appointments(),
    queryFn: () => api.get("/api/appointments").then(r => r.data),
  });

  const filtered = filter === "all"
    ? appointments
    : appointments.filter(a => a.status === filter);

  const upcoming = appointments.filter(a =>
    new Date(a.appointment_dt) >= new Date() && a.status !== "cancelled"
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto" style={{background:"#f0f4f8",minHeight:"100vh"}}>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{color:"#0f172a"}}>Appointments</h1>
            <p className="text-sm" style={{color:"#64748b"}}>
              {upcoming.length > 0
                ? `${upcoming.length} upcoming appointment${upcoming.length > 1 ? "s" : ""}`
                : "No upcoming appointments"}
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4"/> Book appointment
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-0.5 mb-6 p-1 rounded-xl w-fit flex-wrap"
        style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
            style={{
              background: filter === f ? "#0284c7" : "transparent",
              border: "1px solid transparent",
              color: filter === f ? "#ffffff" : "#64748b",
            }}>
            {f === "all" ? "All" : STATUS_CFG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{color:"#0284c7"}}/>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl py-16 text-center"
          style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{color:"#94a3b8"}}/>
          <p className="text-sm" style={{color:"#64748b"}}>
            No {filter !== "all" ? filter : ""} appointments
          </p>
          <button onClick={() => setShowModal(true)} className="text-xs mt-2 transition-colors"
            style={{color:"#0284c7"}}
            onMouseEnter={e=>(e.currentTarget.style.opacity="0.7")}
            onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
            Book your first appointment
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(appt => <AppointmentCard key={appt.id} appt={appt}/>)}
      </div>

      <AnimatePresence>
        {showModal && <NewAppointmentModal onClose={() => setShowModal(false)}/>}
      </AnimatePresence>
    </div>
  );
}
