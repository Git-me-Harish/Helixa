"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  Upload, FileText, Loader2, CheckCircle, XCircle, Clock,
  Trash2, ChevronDown, ChevronRight, Pill, AlertTriangle
} from "lucide-react";
import api from "@/lib/api";
import type { Document } from "@/types";
import { formatDateTime, formatFileSize } from "@/lib/utils";
import { QUERY_KEYS } from "@/lib/queryKeys";

const STATUS_CFG: Record<string, { color:string; bg:string; border:string; icon:React.ElementType }> = {
  pending:    { color:"#d97706", bg:"#fffbeb", border:"#fde68a", icon:Clock },
  processing: { color:"#0284c7", bg:"#e0f2fe", border:"#bae6fd", icon:Loader2 },
  completed:  { color:"#059669", bg:"#ecfdf5", border:"#a7f3d0", icon:CheckCircle },
  failed:     { color:"#dc2626", bg:"#fef2f2", border:"#fecaca", icon:XCircle },
};

function entityStyleForType(type: string): { background:string; color:string; border:string } {
  const map: Record<string, { background:string; color:string; border:string }> = {
    medications: { background:"#eff6ff", color:"#2563eb", border:"#bfdbfe" },
    conditions:  { background:"#fffbeb", color:"#d97706", border:"#fde68a" },
    procedures:  { background:"#f0fdfa", color:"#0d9488", border:"#99f6e4" },
    providers:   { background:"#faf5ff", color:"#7c3aed", border:"#ddd6fe" },
    dates:       { background:"#f8fafc", color:"#334155", border:"#e2e8f0" },
    diagnoses:   { background:"#fef2f2", color:"#dc2626", border:"#fecaca" },
    symptoms:    { background:"#fff7ed", color:"#ea580c", border:"#fed7aa" },
  };
  return map[type.toLowerCase()] ?? { background:"#f0f4f8", color:"#334155", border:"#e2e8f0" };
}

/* -- Upload zone ---------------------------------------------------------- */
function UploadZone({ onUpload }: { onUpload: (file: File) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => files.forEach(onUpload),
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff", ".tif"],
    },
    maxFiles: 5,
  });

  return (
    <div {...getRootProps()}
      className="rounded-2xl p-10 text-center cursor-pointer transition-all"
      style={{
        border: `2px dashed ${isDragActive ? "#0284c7" : "#e2e8f0"}`,
        background: isDragActive ? "#e0f2fe" : "#f8fafc",
        transform: isDragActive ? "scale(1.005)" : "scale(1)",
      }}>
      <input {...getInputProps()}/>
      <motion.div animate={isDragActive ? {scale:1.08} : {scale:1}} transition={{ease:[.16,1,.3,1]}}
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
        style={{background:"#e0f2fe",border:"1px solid #bae6fd"}}>
        <Upload className="w-5 h-5" style={{color:"#0284c7"}}/>
      </motion.div>
      <h3 className="font-medium mb-2" style={{color:"#0f172a"}}>
        {isDragActive ? "Drop your document here" : "Upload medical documents"}
      </h3>
      <p className="text-sm" style={{color:"#64748b"}}>
        Drag and drop PDF, JPG, PNG, or TIFF files, or click to browse
      </p>
      <p className="text-xs mt-2" style={{color:"#94a3b8"}}>Max 10 MB · PDF, JPG, PNG, TIFF</p>
    </div>
  );
}

/* -- Document card -------------------------------------------------------- */
function DocumentCard({ doc }: { doc: Document }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[doc.processing_status] ?? STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const isProcessing = doc.processing_status === "processing" || doc.processing_status === "pending";

  useQuery({
    queryKey: QUERY_KEYS.docStatus(doc.id),
    queryFn: () => api.get(`/api/documents/${doc.id}/status`).then(r => r.data).then(data => {
      if (data.status === "completed" || data.status === "failed") {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.documents()});
      }
      return data;
    }),
    enabled: isProcessing,
    refetchInterval: isProcessing ? 3000 : false,
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/api/documents/${doc.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.documents()}),
  });

  const summary = doc.ai_summary;
  const entities = doc.entities_extracted as Record<string, string[]> | null;

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{ease:[.16,1,.3,1]}}
      className="rounded-2xl overflow-hidden"
      style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>

      {/* Header row */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{background:"#f0f4f8",border:"1px solid #e2e8f0"}}>
          <FileText className="w-5 h-5" style={{color:"#64748b"}}/>
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate" style={{color:"#0f172a"}}>{doc.original_filename}</div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs" style={{color:"#64748b"}}>{formatDateTime(doc.uploaded_at)}</span>
            {doc.file_size_bytes && (
              <span className="text-xs" style={{color:"#94a3b8"}}>{formatFileSize(doc.file_size_bytes)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color}}>
            <StatusIcon className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`}/>
            <span className="capitalize">{doc.processing_status}</span>
          </span>

          {doc.processing_status === "completed" && (
            <button onClick={() => setExpanded(!expanded)}
              className="transition-colors p-1" style={{color:"#64748b"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#0f172a")}
              onMouseLeave={e=>(e.currentTarget.style.color="#64748b")}>
              {expanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
            </button>
          )}

          <button onClick={() => remove.mutate()} disabled={remove.isPending}
            className="transition-colors p-1" style={{color:"#94a3b8"}}
            onMouseEnter={e=>(e.currentTarget.style.color="#dc2626")}
            onMouseLeave={e=>(e.currentTarget.style.color="#94a3b8")}>
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Expanded analysis */}
      <AnimatePresence>
        {expanded && doc.processing_status === "completed" && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 space-y-4"
              style={{borderTop:"1px solid #f1f5f9",background:"#f8fafc"}}>
              <div className="pt-4"/>

              {summary && (
                <>
                  {/* Doc type + urgency tags */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="section-label">AI Analysis</span>
                    {summary.document_type && (
                      <span className="badge badge-info capitalize">{summary.document_type.replace("_"," ")}</span>
                    )}
                    {summary.urgency && summary.urgency !== "routine" && (
                      <span className={`badge ${summary.urgency === "urgent" ? "badge-crit" : "badge-warn"} capitalize`}>
                        {summary.urgency}
                      </span>
                    )}
                  </div>

                  {summary.summary && (
                    <p className="text-sm leading-relaxed" style={{color:"#334155"}}>{summary.summary}</p>
                  )}

                  {(summary.key_findings?.length ?? 0) > 0 && (
                    <div>
                      <div className="section-label mb-2">Key findings</div>
                      <ul className="space-y-1.5">
                        {summary.key_findings!.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{color:"#334155"}}>
                            <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{background:"#0284c7"}}/>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(summary.medications_found?.length ?? 0) > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 section-label mb-2">
                        <Pill className="w-3 h-3"/> Medications found
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {summary.medications_found!.map((m, i) => (
                          <span key={i} className="badge badge-pos">
                            {typeof m === "string" ? m : `${m.name}${m.dosage ? ` ${m.dosage}` : ""}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(summary.recommended_actions?.length ?? 0) > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 section-label mb-2">
                        <AlertTriangle className="w-3 h-3" style={{color:"#d97706"}}/>
                        Recommended actions
                      </div>
                      <ul className="space-y-1.5">
                        {summary.recommended_actions!.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm" style={{color:"#92400e"}}>
                            <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{background:"#d97706"}}/>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {entities && Object.values(entities).some(v => v.length > 0) && (
                <div>
                  <div className="section-label mb-2">Extracted entities</div>
                  <div className="space-y-2">
                    {Object.entries(entities).map(([type, items]) =>
                      items.length > 0 ? (
                        <div key={type} className="flex flex-wrap items-center gap-2">
                          <span className="text-xs capitalize w-20 flex-shrink-0" style={{color:"#64748b"}}>{type}:</span>
                          {items.map((item: string, i: number) => {
                            const es = entityStyleForType(type);
                            return (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-md"
                                style={{background:es.background,border:`1px solid ${es.border}`,color:es.color}}>
                                {item}
                              </span>
                            );
                          })}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* -- Page ----------------------------------------------------------------- */
export default function DocumentsPage() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState<string[]>([]);

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: QUERY_KEYS.documents(),
    queryFn: () => api.get("/api/documents").then(r => r.data),
  });

  const handleUpload = async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setUploading(prev => [...prev, id]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post("/api/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.documents()});
    } finally {
      setUploading(prev => prev.filter(u => u !== id));
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto" style={{background:"#f0f4f8",minHeight:"100vh"}}>
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{color:"#0f172a"}}>Medical Documents</h1>
        <p className="text-sm" style={{color:"#64748b"}}>
          Upload lab reports, prescriptions, and medical records for AI analysis
        </p>
      </motion.div>

      <UploadZone onUpload={handleUpload}/>

      {/* Upload progress banner */}
      {uploading.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mt-4 text-sm"
          style={{background:"#e0f2fe",border:"1px solid #bae6fd",color:"#0284c7"}}>
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0"/>
          Uploading {uploading.length} file{uploading.length > 1 ? "s" : ""}...
        </div>
      )}

      {/* Documents list */}
      <div className="mt-6 space-y-3">
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{color:"#0284c7"}}/>
          </div>
        )}

        {!isLoading && documents.length === 0 && uploading.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 mx-auto mb-3" style={{color:"#94a3b8"}}/>
            <p className="text-sm" style={{color:"#64748b"}}>No documents uploaded yet</p>
            <p className="text-xs mt-1" style={{color:"#94a3b8"}}>Upload a lab report or prescription to see AI analysis</p>
          </div>
        )}

        {documents.map(doc => <DocumentCard key={doc.id} doc={doc}/>)}
      </div>

      <p className="text-xs text-center mt-6" style={{color:"#94a3b8"}}>
        Documents are processed using OCR and AI. Results are for informational purposes only.
      </p>
    </div>
  );
}
