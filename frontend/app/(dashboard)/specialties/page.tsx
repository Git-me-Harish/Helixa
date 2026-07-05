"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Brain, Activity, Shield, Stethoscope, Pill, Microscope, BarChart2,
  Eye, Ear, Baby, Users, Zap, Wind, Flame, Dna, ArrowRight, Search, X
} from "lucide-react";

interface Specialty {
  name: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  description: string;
  symptoms: string[];
  commonTests: string[];
  aiCapabilities: string[];
}

const SPECIALTIES: Specialty[] = [
  {
    name:"Cardiology", icon:Heart, color:"#dc2626", bg:"#fef2f2", border:"#fecaca",
    description:"Heart and cardiovascular system. AI analyzes ECG patterns, blood pressure trends, and cardiac risk factors.",
    symptoms:["Chest pain","Shortness of breath","Palpitations","Edema","Fatigue"],
    commonTests:["ECG","Echocardiogram","Lipid panel","Stress test","Coronary angiography"],
    aiCapabilities:["ECG pattern analysis","BP trend detection","Cardiac risk scoring","Medication interaction check"],
  },
  {
    name:"Neurology", icon:Brain, color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe",
    description:"Brain, spinal cord, and nervous system disorders. AI detects cognitive patterns and neurological risk.",
    symptoms:["Headache","Dizziness","Memory loss","Numbness","Seizures"],
    commonTests:["MRI brain","EEG","Nerve conduction","CSF analysis","CT scan"],
    aiCapabilities:["Cognitive trend analysis","Headache pattern recognition","Seizure risk assessment","Medication review"],
  },
  {
    name:"Orthopedics", icon:Activity, color:"#0284c7", bg:"#eff6ff", border:"#bfdbfe",
    description:"Bones, joints, muscles, and musculoskeletal conditions. AI analyzes mobility and injury risk.",
    symptoms:["Joint pain","Swelling","Limited motion","Fractures","Back pain"],
    commonTests:["X-Ray","MRI joint","Bone density","Arthroscopy","Joint fluid analysis"],
    aiCapabilities:["Injury risk assessment","Physical therapy tracking","Pain trend analysis","Recovery timeline"],
  },
  {
    name:"Dermatology", icon:Shield, color:"#d97706", bg:"#fffbeb", border:"#fde68a",
    description:"Skin, hair, and nail conditions. AI can cross-reference skin findings with systemic disease patterns.",
    symptoms:["Rash","Itching","Lesions","Hair loss","Nail changes"],
    commonTests:["Skin biopsy","Patch test","Dermoscopy","KOH preparation","Blood markers"],
    aiCapabilities:["Skin condition classification","Autoimmune correlation","Allergy tracking","Treatment monitoring"],
  },
  {
    name:"Endocrinology", icon:Zap, color:"#0891b2", bg:"#ecfeff", border:"#a5f3fc",
    description:"Hormones, diabetes, thyroid, and metabolic disorders. AI monitors glucose trends and hormonal patterns.",
    symptoms:["Fatigue","Weight changes","Thirst","Polyuria","Temperature sensitivity"],
    commonTests:["HbA1c","Thyroid panel","Glucose curve","Cortisol","Insulin levels"],
    aiCapabilities:["Glucose trend prediction","HbA1c forecasting","Thyroid monitoring","Diabetic risk scoring"],
  },
  {
    name:"Gastroenterology", icon:Flame, color:"#f59e0b", bg:"#fef3c7", border:"#fde68a",
    description:"Digestive system and GI tract. AI tracks symptom patterns, dietary triggers, and medication efficacy.",
    symptoms:["Abdominal pain","Bloating","Diarrhea","Constipation","GERD"],
    commonTests:["Endoscopy","Colonoscopy","H. pylori test","Liver panel","Stool analysis"],
    aiCapabilities:["Symptom pattern analysis","Dietary trigger correlation","IBD monitoring","Medication response"],
  },
  {
    name:"Pulmonology", icon:Wind, color:"#6366f1", bg:"#eef2ff", border:"#c7d2fe",
    description:"Lungs and respiratory system. AI analyzes SpO₂ trends, breathing patterns, and respiratory risk.",
    symptoms:["Cough","Dyspnea","Wheezing","Chest tightness","Hemoptysis"],
    commonTests:["Spirometry","Chest X-ray","CT thorax","ABG","Bronchoscopy"],
    aiCapabilities:["SpO₂ trend monitoring","Asthma risk scoring","COPD progression","Sleep apnea detection"],
  },
  {
    name:"Psychiatry", icon:Brain, color:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe",
    description:"Mental health, mood disorders, and psychiatric conditions. AI screens for depression, anxiety, and cognitive patterns.",
    symptoms:["Depressed mood","Anxiety","Sleep issues","Cognitive changes","Behavioral changes"],
    commonTests:["PHQ-9","GAD-7","MMSE","Neuropsychological testing","Sleep study"],
    aiCapabilities:["Mood trend analysis","Anxiety screening","Cognitive decline detection","Medication adherence"],
  },
  {
    name:"Ophthalmology", icon:Eye, color:"#059669", bg:"#ecfdf5", border:"#a7f3d0",
    description:"Eye health and vision. AI tracks visual acuity changes and screens for diabetic retinopathy.",
    symptoms:["Vision changes","Eye pain","Floaters","Redness","Dry eyes"],
    commonTests:["Visual acuity","Tonometry","Fundoscopy","OCT","Perimetry"],
    aiCapabilities:["Diabetic retinopathy screening","Glaucoma risk","Cataract monitoring","Vision trend analysis"],
  },
  {
    name:"Nephrology", icon:Droplets, color:"#0369a1", bg:"#e0f2fe", border:"#7dd3fc",
    description:"Kidneys and urinary system. AI monitors kidney function markers, eGFR trends, and medication nephrotoxicity.",
    symptoms:["Edema","Hematuria","Oliguria","Fatigue","Hypertension"],
    commonTests:["Creatinine","eGFR","Urinalysis","24h urine","Kidney biopsy"],
    aiCapabilities:["eGFR trend prediction","CKD staging","Fluid balance tracking","Nephrotoxic drug detection"],
  },
  {
    name:"Oncology", icon:Dna, color:"#e11d48", bg:"#fff1f2", border:"#fecdd3",
    description:"Cancer diagnosis, treatment, and surveillance. AI assists in treatment planning and recurrence monitoring.",
    symptoms:["Unexplained weight loss","Fatigue","Pain","Lumps","Night sweats"],
    commonTests:["Biopsy","CT/PET scan","Tumor markers","CBC","Genetic testing"],
    aiCapabilities:["Treatment response tracking","Recurrence risk monitoring","Side effect management","Lab trend analysis"],
  },
  {
    name:"Pediatrics", icon:Baby, color:"#f97316", bg:"#fff7ed", border:"#fed7aa",
    description:"Children's health from birth through adolescence. AI tracks growth, development, and vaccination schedules.",
    symptoms:["Fever","Growth delay","Developmental concerns","Recurrent infections","Behavioral issues"],
    commonTests:["Growth charts","CBC","Developmental screening","Vision/hearing","Immunization titres"],
    aiCapabilities:["Growth curve analysis","Vaccine schedule tracking","Developmental milestone monitoring"],
  },
];

function Droplets({ className, style }: { className?: string; style?: any }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
}

function Dna({ className, style }: { className?: string; style?: any }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/><path d="m3.5 14.5.5.5"/><path d="m20 9 .5.5"/><path d="m6.5 12.5 1 1"/><path d="m16.5 10.5 1 1"/><path d="m10 16 1.5 1.5"/></svg>;
}

function Baby({ className, style }: { className?: string; style?: any }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>;
}

/* ── Specialty modal ─────────────────────────────────────────────────────── */
function SpecialtyModal({ spec, onClose }: { spec: Specialty; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:"rgba(15,23,42,.4)",backdropFilter:"blur(8px)"}}
      onClick={onClose}>
      <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.96}}
        className="card w-full max-w-lg overflow-hidden max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 p-5 border-b flex items-start gap-4" style={{background:"white",borderColor:"#f1f5f9"}}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:spec.bg}}>
            <spec.icon className="w-6 h-6" style={{color:spec.color}}/>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>{spec.name}</h2>
            <p className="text-xs mt-0.5" style={{color:"#64748b"}}>{spec.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{color:"#94a3b8"}}
            onMouseEnter={e=>(e.currentTarget.style.background="#f1f5f9")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="section-label mb-3">Common Symptoms</div>
            <div className="flex flex-wrap gap-2">
              {spec.symptoms.map(s => (
                <span key={s} className="badge badge-neutral">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label mb-3">Common Diagnostic Tests</div>
            <div className="flex flex-wrap gap-2">
              {spec.commonTests.map(t => (
                <span key={t} className="badge" style={{background:spec.bg,color:spec.color,borderColor:spec.border}}>{t}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label mb-3">AI Capabilities in Helixa</div>
            <div className="space-y-2">
              {spec.aiCapabilities.map(cap => (
                <div key={cap} className="flex items-center gap-2.5 text-sm" style={{color:"#334155"}}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{background:spec.bg}}>
                    <Zap className="w-2.5 h-2.5" style={{color:spec.color}}/>
                  </div>
                  {cap}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/chat" className="btn btn-primary flex-1 justify-center">
              Ask AI about {spec.name} <ArrowRight className="w-4 h-4"/>
            </Link>
            <Link href="/doctors" className="btn btn-outline flex-1 justify-center">
              Find {spec.name} Doctors
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function SpecialtiesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Specialty | null>(null);

  const filtered = SPECIALTIES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.symptoms.some(sym => sym.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{color:"#0f172a",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Medical Specialties</h1>
        <p className="text-sm" style={{color:"#64748b"}}>
          Browse specialties, understand symptoms, and discover AI capabilities for each domain
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:"#94a3b8"}}/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search specialty or symptom…" className="field pl-9"/>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((spec, i) => (
          <motion.div key={spec.name} initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{delay:i*.04}}
            className="card-hover p-5 cursor-pointer group"
            onClick={() => setSelected(spec)}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
              style={{background:spec.bg}}>
              <spec.icon className="w-6 h-6" style={{color:spec.color}}/>
            </div>
            <h3 className="font-semibold text-sm mb-1.5" style={{color:"#0f172a"}}>{spec.name}</h3>
            <p className="text-xs line-clamp-2 mb-3" style={{color:"#64748b"}}>{spec.description}</p>
            <div className="flex flex-wrap gap-1">
              {spec.symptoms.slice(0,2).map(s => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{background:spec.bg,color:spec.color}}>{s}</span>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{color:spec.color}}>
              View details <ArrowRight className="w-3 h-3"/>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card py-16 text-center">
          <Search className="w-10 h-10 mx-auto mb-3" style={{color:"#e2e8f0"}}/>
          <p className="text-sm" style={{color:"#94a3b8"}}>No specialties match "{search}"</p>
        </div>
      )}

      <AnimatePresence>
        {selected && <SpecialtyModal spec={selected} onClose={() => setSelected(null)}/>}
      </AnimatePresence>
    </div>
  );
}
