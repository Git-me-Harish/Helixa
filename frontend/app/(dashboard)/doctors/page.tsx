"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Phone, Stethoscope, Loader2, User, ChevronDown, ChevronUp, Filter } from "lucide-react";
import type { NPIDoctor } from "@/types";
import { QUERY_KEYS } from "@/lib/queryKeys";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA",
  "RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const SPECIALTY_SUGGESTIONS = [
  "Internal Medicine","Family Medicine","Cardiology","Neurology","Orthopedic Surgery",
  "Dermatology","Pediatrics","Psychiatry","Obstetrics & Gynecology","Radiology",
  "Emergency Medicine","Anesthesiology","Oncology","Endocrinology","Gastroenterology",
  "Nephrology","Pulmonology","Rheumatology","Urology","Ophthalmology",
];

function getDoctorName(doc: NPIDoctor): string {
  if (doc.basic.organization_name) return doc.basic.organization_name;
  const parts = [doc.basic.first_name, doc.basic.middle_name, doc.basic.last_name].filter(Boolean);
  const cred = doc.basic.credential ? `, ${doc.basic.credential}` : "";
  return parts.join(" ") + cred;
}

function getPrimarySpecialty(doc: NPIDoctor): string | null {
  const primary = doc.taxonomies.find(t => t.primary);
  return primary?.desc ?? doc.taxonomies[0]?.desc ?? null;
}

function getPrimaryAddress(doc: NPIDoctor) {
  return doc.addresses.find(a => a.address_purpose === "LOCATION") ?? doc.addresses[0];
}

/* ── Doctor card ─────────────────────────────────────────────────────────── */
function DoctorCard({ doc, idx }: { doc: NPIDoctor; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const name    = getDoctorName(doc);
  const spec    = getPrimarySpecialty(doc);
  const address = getPrimaryAddress(doc);

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*.04}}
      className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{background:"#e0f2fe"}}>
            <User className="w-6 h-6" style={{color:"#0284c7"}}/>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[--text-primary] mb-0.5 line-clamp-2">{name}</h3>
            {spec && (
              <span className="badge badge-brand text-xs">{spec}</span>
            )}
            {address && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{color:"#64748b"}}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0"/>
                <span className="truncate">{[address.city, address.state].filter(Boolean).join(", ")}</span>
              </div>
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

      {expanded && (
        <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
          className="overflow-hidden border-t" style={{borderColor:"#f1f5f9"}}>
          <div className="p-5 space-y-4">
            <div>
              <div className="section-label mb-2">NPI Number</div>
              <code className="text-sm font-mono" style={{color:"#334155"}}>{doc.number}</code>
            </div>

            {doc.taxonomies.length > 0 && (
              <div>
                <div className="section-label mb-2">Specialties</div>
                <div className="flex flex-wrap gap-1.5">
                  {doc.taxonomies.map((t, i) => (
                    <span key={i} className={`badge ${t.primary ? "badge-brand" : "badge-neutral"}`}>
                      {t.desc}{t.primary && <span className="ml-1 opacity-60">· Primary</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {doc.addresses.length > 0 && (
              <div>
                <div className="section-label mb-2">Addresses</div>
                {doc.addresses.map((a, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <div className="text-xs font-medium mb-0.5 capitalize" style={{color:"#0284c7"}}>
                      {(a.address_purpose ?? "").toLowerCase().replace("_", " ")}
                    </div>
                    <div className="text-sm" style={{color:"#334155"}}>
                      {a.address_1}{a.address_2 ? `, ${a.address_2}` : ""}
                    </div>
                    <div className="text-sm" style={{color:"#64748b"}}>
                      {[a.city, a.state, a.postal_code].filter(Boolean).join(", ")}
                    </div>
                    {a.telephone_number && (
                      <div className="flex items-center gap-1 mt-1 text-sm" style={{color:"#0284c7"}}>
                        <Phone className="w-3.5 h-3.5"/>
                        {a.telephone_number}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function DoctorsPage() {
  const [name, setName]         = useState("");
  const [specialty, setSpec]    = useState("");
  const [state, setState]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  const params = new URLSearchParams();
  if (name)     params.set("name", name);
  if (specialty) params.set("specialty", specialty);
  if (state)    params.set("state", state);
  params.set("limit", "25");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: QUERY_KEYS.npiDoctors(name, specialty, state),
    queryFn: async () => {
      const res = await fetch(`/api/doctors?${params.toString()}`);
      if (!res.ok) throw new Error("NPI lookup failed");
      return res.json();
    },
    enabled: submitted && (!!name || !!specialty || !!state),
    staleTime: 60_000,
  });

  const doctors: NPIDoctor[] = data?.results ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Find Doctors</h1>
        <p className="text-sm" style={{color:"#64748b"}}>
          Search verified physicians from the US National Provider Identifier (NPI) registry
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.05}}
        className="card p-5 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Doctor / Organization Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:"#94a3b8"}}/>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Dr. Smith, Memorial Hospital…" className="field pl-9"/>
              </div>
            </div>

            <div>
              <label className="label">Specialty</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:"#94a3b8"}}/>
                <input value={specialty} onChange={e => setSpec(e.target.value)}
                  placeholder="Cardiology, Family Medicine…" className="field pl-9"
                  list="specialty-list"/>
                <datalist id="specialty-list">
                  {SPECIALTY_SUGGESTIONS.map(s => <option key={s} value={s}/>)}
                </datalist>
              </div>
            </div>

            <div>
              <label className="label">State</label>
              <select value={state} onChange={e => setState(e.target.value)} className="field">
                <option value="">All states</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            {isLoading || isFetching ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
            Search NPI Registry
          </button>
        </form>
      </motion.div>

      {/* Results */}
      {(isLoading || isFetching) && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{color:"#0284c7"}}/>
            <p className="text-sm" style={{color:"#64748b"}}>Searching NPI registry…</p>
          </div>
        </div>
      )}

      {!isLoading && !isFetching && submitted && doctors.length === 0 && (
        <div className="card py-16 text-center">
          <Stethoscope className="w-12 h-12 mx-auto mb-3" style={{color:"#e2e8f0"}}/>
          <h3 className="font-semibold mb-2" style={{color:"#334155"}}>No providers found</h3>
          <p className="text-sm" style={{color:"#94a3b8"}}>Try broadening your search — different specialty term or remove the state filter</p>
        </div>
      )}

      {!submitted && (
        <div className="card py-16 text-center">
          <Filter className="w-12 h-12 mx-auto mb-3" style={{color:"#e2e8f0"}}/>
          <h3 className="font-semibold mb-2" style={{color:"#334155"}}>Search the NPI registry</h3>
          <p className="text-sm max-w-sm mx-auto" style={{color:"#94a3b8"}}>
            Enter a doctor's name, specialty, or state to find verified healthcare providers from the CMS National Provider Identifier database.
          </p>
        </div>
      )}

      {doctors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium" style={{color:"#64748b"}}>
              {doctors.length} provider{doctors.length !== 1 ? "s" : ""} found
              <span className="ml-2 text-xs" style={{color:"#94a3b8"}}>· NPI Registry data</span>
            </p>
          </div>
          <div className="space-y-3">
            {doctors.map((doc, i) => <DoctorCard key={doc.number} doc={doc} idx={i}/>)}
          </div>
        </div>
      )}

      <p className="text-xs text-center mt-8" style={{color:"#94a3b8"}}>
        Data sourced from the CMS National Provider Identifier (NPI) Registry. For informational purposes only.
      </p>
    </div>
  );
}
