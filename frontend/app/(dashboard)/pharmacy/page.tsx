"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Pill, Loader2, ChevronDown, ChevronUp,
  AlertTriangle, Info, CheckCircle, XCircle, Zap, ArrowLeftRight,
} from "lucide-react";
import type { DrugLabel, DrugInteractionResult } from "@/types";
import { QUERY_KEYS } from "@/lib/queryKeys";

function getDrugName(drug: DrugLabel): string {
  return drug.openfda.brand_name?.[0]
    ?? drug.openfda.generic_name?.[0]
    ?? drug.openfda.substance_name?.[0]
    ?? "Unknown Drug";
}

function truncate(text: string | undefined, max = 400): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

/* ── Drug label card ─────────────────────────────────────────────────────── */
function DrugCard({ drug, idx }: { drug: DrugLabel; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const name        = getDrugName(drug);
  const genericName = drug.openfda.generic_name?.[0];
  const manufacturer= drug.openfda.manufacturer_name?.[0];
  const route       = drug.openfda.route?.[0];
  const productType = drug.openfda.product_type?.[0];

  const SECTIONS = [
    { key:"indications_and_usage",    label:"Indications & Usage",     icon:CheckCircle,  color:"#059669" },
    { key:"dosage_and_administration",label:"Dosage & Administration", icon:Info,         color:"#0284c7" },
    { key:"warnings",                 label:"Warnings",                icon:AlertTriangle,color:"#d97706" },
    { key:"contraindications",        label:"Contraindications",       icon:XCircle,      color:"#dc2626" },
    { key:"drug_interactions",        label:"Drug Interactions",       icon:AlertTriangle,color:"#7c3aed" },
  ] as const;

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*.04}}
      className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:"#ecfeff"}}>
            <Pill className="w-6 h-6" style={{color:"#0891b2"}}/>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1 line-clamp-2" style={{color:"#0f172a"}}>{name}</h3>
            <div className="flex flex-wrap gap-1.5">
              {genericName && genericName !== name && (
                <span className="badge badge-neutral">Generic: {genericName}</span>
              )}
              {route && <span className="badge badge-brand">{route}</span>}
              {productType && <span className="badge badge-teal capitalize">{productType.toLowerCase()}</span>}
            </div>
            {manufacturer && (
              <p className="text-xs mt-1.5" style={{color:"#94a3b8"}}>{manufacturer}</p>
            )}
          </div>
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{color:"#94a3b8"}}
            onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
            className="overflow-hidden border-t" style={{borderColor:"#f1f5f9"}}>
            <div className="p-5 space-y-4">
              {SECTIONS.map(({ key, label, icon:Icon, color }) => {
                const text = (drug[key as keyof DrugLabel] as string[] | undefined)?.[0];
                if (!text) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-3.5 h-3.5" style={{color}}/>
                      <div className="section-label">{label}</div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{color:"#334155"}}>
                      {truncate(text)}
                    </p>
                  </div>
                );
              })}
              {drug.openfda.application_number?.length ? (
                <div className="pt-2 border-t" style={{borderColor:"#f1f5f9"}}>
                  <div className="section-label mb-1">FDA Application</div>
                  <code className="text-xs" style={{color:"#64748b"}}>{drug.openfda.application_number[0]}</code>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Interaction checker ─────────────────────────────────────────────────── */
function InteractionChecker() {
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [submitted, setSubmitted] = useState<{a:string;b:string} | null>(null);

  const { data, isLoading, error } = useQuery<DrugInteractionResult>({
    queryKey: QUERY_KEYS.drugInteraction(submitted?.a ?? "", submitted?.b ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/drugs/interactions?a=${encodeURIComponent(submitted!.a)}&b=${encodeURIComponent(submitted!.b)}`
      );
      if (!res.ok) throw new Error("Interaction lookup failed");
      return res.json();
    },
    enabled: !!submitted,
    staleTime: 300_000,
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugA.trim() || !drugB.trim()) return;
    setSubmitted({ a: drugA.trim(), b: drugB.trim() });
  };

  const flagged = data?.crossMentions.flagged;
  const notFound = submitted && data && (!data.drugA || !data.drugB);

  return (
    <div className="space-y-5">
      {/* Input card */}
      <div className="card p-5">
        <p className="text-sm mb-4" style={{color:"#64748b"}}>
          Enter two drug names to check if their FDA labels warn about interactions with each other.
        </p>
        <form onSubmit={handleCheck}>
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="label">First drug</label>
              <input value={drugA} onChange={e => setDrugA(e.target.value)}
                placeholder="e.g. Warfarin" className="field" required/>
            </div>
            <div className="flex items-center justify-center pb-0.5">
              <ArrowLeftRight className="w-5 h-5" style={{color:"#94a3b8"}}/>
            </div>
            <div>
              <label className="label">Second drug</label>
              <input value={drugB} onChange={e => setDrugB(e.target.value)}
                placeholder="e.g. Aspirin" className="field" required/>
            </div>
          </div>
          <button type="submit" disabled={!drugA.trim() || !drugB.trim() || isLoading}
            className="btn btn-primary mt-4">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin"/>Checking…</> : <><Zap className="w-4 h-4"/>Check Interaction</>}
          </button>
        </form>
      </div>

      {/* Result */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{color:"#0284c7"}}/>
        </div>
      )}

      {error && (
        <div className="card p-5 flex items-center gap-3" style={{borderColor:"#fecaca",background:"#fef2f2"}}>
          <XCircle className="w-5 h-5 flex-shrink-0" style={{color:"#dc2626"}}/>
          <p className="text-sm" style={{color:"#991b1b"}}>FDA lookup failed. Try again shortly.</p>
        </div>
      )}

      {notFound && !isLoading && (
        <div className="card p-5 text-center py-10">
          <Pill className="w-10 h-10 mx-auto mb-3" style={{color:"#e2e8f0"}}/>
          <p className="text-sm font-medium" style={{color:"#334155"}}>
            One or both drugs not found in the FDA database.
          </p>
          <p className="text-xs mt-1" style={{color:"#94a3b8"}}>Try the generic name or active ingredient.</p>
        </div>
      )}

      {data && data.drugA && data.drugB && !isLoading && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
          {/* Verdict banner */}
          {flagged ? (
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{background:"#fef2f2",border:"1px solid #fecaca"}}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color:"#dc2626"}}/>
              <div>
                <p className="text-sm font-semibold" style={{color:"#991b1b"}}>
                  Potential interaction flagged
                </p>
                <p className="text-xs mt-0.5" style={{color:"#b91c1c"}}>
                  At least one drug&apos;s FDA label explicitly mentions the other. Review the sections below and consult your pharmacist or physician before combining these medications.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{background:"#ecfdf5",border:"1px solid #a7f3d0"}}>
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color:"#059669"}}/>
              <div>
                <p className="text-sm font-semibold" style={{color:"#065f46"}}>
                  No cross-mention found in FDA labels
                </p>
                <p className="text-xs mt-0.5" style={{color:"#047857"}}>
                  Neither drug&apos;s FDA label mentions the other by name. This does not guarantee safety — always consult a pharmacist or physician before combining medications.
                </p>
              </div>
            </div>
          )}

          {/* Side-by-side label excerpts */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: data.drugA, warnsFlaggedOther: data.crossMentions.aWarnsAboutB },
              { label: data.drugB, warnsFlaggedOther: data.crossMentions.bWarnsAboutA },
            ].map(({ label: lbl, warnsFlaggedOther }, idx) => (
              <div key={idx} className="card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{background:"#ecfeff"}}>
                    <Pill className="w-4 h-4" style={{color:"#0891b2"}}/>
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{color:"#0f172a"}}>
                      {lbl.brand ?? lbl.name}
                    </div>
                    {lbl.generic && lbl.generic !== lbl.brand && (
                      <div className="text-xs" style={{color:"#64748b"}}>{lbl.generic}</div>
                    )}
                  </div>
                  {warnsFlaggedOther && (
                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca"}}>
                      Flags interaction
                    </span>
                  )}
                </div>

                {lbl.interactions ? (
                  <div>
                    <div className="section-label mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" style={{color:"#7c3aed"}}/>
                      Drug Interactions (from FDA label)
                    </div>
                    <p className="text-xs leading-relaxed" style={{color:"#334155"}}>
                      {truncate(lbl.interactions, 500)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs" style={{color:"#94a3b8"}}>
                    No drug interactions section in FDA label.
                  </p>
                )}

                {lbl.warnings && (
                  <div>
                    <div className="section-label mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" style={{color:"#d97706"}}/>
                      Key Warnings
                    </div>
                    <p className="text-xs leading-relaxed" style={{color:"#334155"}}>
                      {truncate(lbl.warnings, 300)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{background:"#fffbeb",border:"1px solid #fde68a"}}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color:"#d97706"}}/>
        <p className="text-xs leading-relaxed" style={{color:"#92400e"}}>
          This tool performs a text-match against FDA labeling data only. It does not constitute clinical drug interaction screening. Always consult a licensed pharmacist or physician before combining medications.
        </p>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
const COMMON_DRUGS = ["Metformin","Lisinopril","Atorvastatin","Aspirin","Amlodipine","Omeprazole","Metoprolol","Albuterol","Levothyroxine","Gabapentin"];
const TABS = ["Drug Search", "Interaction Checker"] as const;
type Tab = typeof TABS[number];

export default function PharmacyPage() {
  const [tab, setTab] = useState<Tab>("Drug Search");

  // Search tab state
  const [query, setQuery]             = useState("");
  const [submitted, setSubmitted]     = useState(false);
  const [activeQuery, setActiveQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.drugs(activeQuery),
    queryFn: async () => {
      const res = await fetch(`/api/drugs?q=${encodeURIComponent(activeQuery)}&limit=10`);
      if (!res.ok) throw new Error("FDA lookup failed");
      return res.json();
    },
    enabled: !!activeQuery,
    staleTime: 120_000,
  });

  const drugs: DrugLabel[] = data?.results ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveQuery(query.trim());
    setSubmitted(true);
  };

  const searchDrug = (name: string) => {
    setQuery(name);
    setActiveQuery(name);
    setSubmitted(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Pharmacy</h1>
        <p className="text-sm" style={{color:"#64748b"}}>
          FDA drug labels — indications, dosing, warnings, and interaction checking via OpenFDA
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-xl w-fit mb-6"
        style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t ? "#0284c7" : "transparent",
              color: tab === t ? "#ffffff" : "#64748b",
            }}>
            {t === "Interaction Checker" && <ArrowLeftRight className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5"/>}
            {t}
          </button>
        ))}
      </div>

      {tab === "Drug Search" && (
        <div>
          {/* Search card */}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.05}}
            className="card p-5 mb-6">
            <form onSubmit={handleSearch}>
              <label className="label">Search drug name, generic name, or active ingredient</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:"#94a3b8"}}/>
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Metformin, Lisinopril, Aspirin…" className="field pl-9"/>
                </div>
                <button type="submit" disabled={!query.trim()} className="btn btn-primary">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                  Search FDA
                </button>
              </div>
            </form>

            <div className="mt-4">
              <div className="section-label mb-2">Common medications</div>
              <div className="flex flex-wrap gap-2">
                {COMMON_DRUGS.map(drug => (
                  <button key={drug} onClick={() => searchDrug(drug)}
                    className="badge badge-neutral cursor-pointer hover:border-[#0284c7] hover:text-[#0284c7] transition-colors"
                    style={{padding:".25rem .75rem"}}>
                    {drug}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
            style={{background:"#fffbeb",border:"1px solid #fde68a"}}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color:"#d97706"}}/>
            <p className="text-xs leading-relaxed" style={{color:"#92400e"}}>
              Drug information is sourced from the FDA OpenFDA database and is for informational purposes only.
              Always consult a licensed pharmacist or physician before starting, stopping, or changing any medication.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{color:"#0284c7"}}/>
                <p className="text-sm" style={{color:"#64748b"}}>Looking up FDA drug database…</p>
              </div>
            </div>
          )}

          {!isLoading && submitted && drugs.length === 0 && (
            <div className="card py-16 text-center">
              <Pill className="w-12 h-12 mx-auto mb-3" style={{color:"#e2e8f0"}}/>
              <h3 className="font-semibold mb-2" style={{color:"#334155"}}>No results for &quot;{activeQuery}&quot;</h3>
              <p className="text-sm" style={{color:"#94a3b8"}}>Try the generic name, brand name, or active ingredient</p>
            </div>
          )}

          {!submitted && (
            <div className="card py-16 text-center">
              <Pill className="w-12 h-12 mx-auto mb-3" style={{color:"#e2e8f0"}}/>
              <h3 className="font-semibold mb-2" style={{color:"#334155"}}>FDA drug information at your fingertips</h3>
              <p className="text-sm max-w-sm mx-auto" style={{color:"#94a3b8"}}>
                Search any medication to view FDA-approved labeling: indications, dosing, warnings, contraindications, and drug interactions.
              </p>
            </div>
          )}

          {drugs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{color:"#64748b"}}>
                  {drugs.length} result{drugs.length !== 1 ? "s" : ""} for &quot;{activeQuery}&quot;
                  <span className="ml-2 text-xs" style={{color:"#94a3b8"}}>· FDA OpenFDA data</span>
                </p>
              </div>
              <div className="space-y-3">
                {drugs.map((drug, i) => <DrugCard key={drug.id ?? i} drug={drug} idx={i}/>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Interaction Checker" && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}>
          <InteractionChecker/>
        </motion.div>
      )}
    </div>
  );
}
