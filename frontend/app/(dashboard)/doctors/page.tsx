"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Search, MapPin, Phone, Globe, Stethoscope, Loader2, Building2,
  ChevronDown, Filter, X, Check, MapPinned, Clock, Zap, Heart,
} from "lucide-react";
import type { IndiaDoctor, OSMTags } from "@/types";
import { QUERY_KEYS } from "@/lib/queryKeys";

/* ══════════════════════════════════════════════════════════════════════════════
   SPECIALTIES  —  comprehensive list covering all major Indian healthcare categories
══════════════════════════════════════════════════════════════════════════════ */
const SPECIALTIES = [
  { label: "All types",              value: "" },
  { label: "Hospital",               value: "Hospital" },
  { label: "General Practice",       value: "General Practice" },
  { label: "General Surgery",        value: "General Surgery" },
  { label: "Internal Medicine",      value: "Internal Medicine" },
  { label: "Family Medicine",        value: "Family Medicine" },
  { label: "Emergency Medicine",     value: "Emergency Medicine" },
  { label: "Anaesthesiology",        value: "Anaesthesiology" },
  { label: "Ayurveda",               value: "Ayurveda" },
  { label: "Cardiology",             value: "Cardiology" },
  { label: "Cardiothoracic Surgery", value: "Cardiothoracic Surgery" },
  { label: "Dentistry",              value: "Dentistry" },
  { label: "Dermatology",            value: "Dermatology" },
  { label: "Diabetology",            value: "Diabetology" },
  { label: "Endocrinology",          value: "Endocrinology" },
  { label: "ENT",                    value: "ENT" },
  { label: "Gastroenterology",       value: "Gastroenterology" },
  { label: "Gynaecology",            value: "Gynaecology" },
  { label: "Haematology",            value: "Haematology" },
  { label: "Homoeopathy",            value: "Homoeopathy" },
  { label: "Immunology",             value: "Immunology" },
  { label: "Nephrology",             value: "Nephrology" },
  { label: "Neurology",              value: "Neurology" },
  { label: "Neurosurgery",           value: "Neurosurgery" },
  { label: "Obstetrics",             value: "Obstetrics" },
  { label: "Oncology",               value: "Oncology" },
  { label: "Ophthalmology",          value: "Ophthalmology" },
  { label: "Orthopaedics",           value: "Orthopaedics" },
  { label: "Paediatrics",            value: "Paediatrics" },
  { label: "Pathology",              value: "Pathology" },
  { label: "Pharmacy",               value: "Pharmacy" },
  { label: "Physiotherapy",          value: "Physiotherapy" },
  { label: "Plastic Surgery",        value: "Plastic Surgery" },
  { label: "Psychiatry",             value: "Psychiatry" },
  { label: "Pulmonology",            value: "Pulmonology" },
  { label: "Radiology",              value: "Radiology" },
  { label: "Rheumatology",           value: "Rheumatology" },
  { label: "Siddha",                 value: "Siddha" },
  { label: "Unani",                  value: "Unani" },
  { label: "Urology",                value: "Urology" },
  { label: "Vascular Surgery",       value: "Vascular Surgery" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   INDIA GEO DATA  — 28 states + 8 UTs with major cities/districts
══════════════════════════════════════════════════════════════════════════════ */
const INDIA_GEO: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Kakinada","Tirupati","Rajahmundry","Kadapa","Anantapur","Eluru","Ongole","Vizianagaram","Srikakulam","Chittoor"],
  "Arunachal Pradesh": ["Itanagar","Naharlagun","Pasighat","Bomdila","Ziro","Along","Tezu","Changlang","Khonsa"],
  "Assam": ["Guwahati","Dibrugarh","Jorhat","Silchar","Nagaon","Tezpur","Bongaigaon","Goalpara","Golaghat","Karimganj","Hailakandi","Lakhimpur","Sivasagar","Dhubri","Kokrajhar"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Purnia","Darbhanga","Bihar Sharif","Arrah","Begusarai","Katihar","Munger","Chhapra","Bettiah","Motihari","Saharsa"],
  "Chhattisgarh": ["Raipur","Bhilai","Bilaspur","Durg","Korba","Rajnandgaon","Jagdalpur","Ambikapur","Dhamtari","Raigarh","Mahasamund","Kanker"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Bicholim","Sanquelim"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Junagadh","Gandhinagar","Anand","Mehsana","Morbi","Nadiad","Valsad","Navsari","Bharuch","Godhra","Surendranagar","Amreli","Porbandar","Patan"],
  "Haryana": ["Gurugram","Faridabad","Ambala","Rohtak","Hisar","Panipat","Sonipat","Karnal","Yamunanagar","Panchkula","Bhiwani","Jhajjar","Rewari","Sirsa","Fatehabad","Kaithal","Kurukshetra","Nuh","Palwal"],
  "Himachal Pradesh": ["Shimla","Manali","Dharamshala","Solan","Mandi","Kullu","Hamirpur","Una","Nahan","Bilaspur","Chamba"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih","Ramgarh","Dumka","Medininagar"],
  "Karnataka": ["Bengaluru","Mysuru","Mangaluru","Hubballi","Belagavi","Kalaburagi","Ballari","Vijayapura","Shivamogga","Tumakuru","Davangere","Bidar","Hassan","Udupi","Dharwad","Raichur","Bagalkot","Chitradurga","Mandya"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Palakkad","Alappuzha","Kannur","Kottayam","Malappuram","Kasaragod","Idukki","Wayanad","Pathanamthitta"],
  "Madhya Pradesh": ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Dewas","Satna","Ratlam","Rewa","Singrauli","Burhanpur","Khandwa","Bhind","Morena","Chhindwara","Guna","Shivpuri","Vidisha","Chhatarpur","Damoh","Mandsaur","Neemuch"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Solapur","Amravati","Kolhapur","Nanded","Sangli","Satara","Palghar","Ratnagiri","Dhule","Jalgaon","Ahmednagar","Latur","Yavatmal","Buldhana","Akola","Wardha","Chandrapur","Gondia"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Churachandpur","Senapati","Ukhrul"],
  "Meghalaya": ["Shillong","Tura","Jowai","Nongstoin","Williamnagar"],
  "Mizoram": ["Aizawl","Lunglei","Champhai","Serchhip","Kolasib"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung","Tuensang","Wokha","Zunheboto","Mon"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore","Baripada","Bhadrak","Balangir","Jeypore","Dhenkanal","Koraput","Sundargarh"],
  "Punjab": ["Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda","Mohali","Pathankot","Hoshiarpur","Batala","Gurdaspur","Moga","Muktsar","Faridkot","Firozpur","Ropar","Kapurthala","Sangrur","Mansa","Barnala"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner","Bharatpur","Alwar","Bhilwara","Sri Ganganagar","Pali","Sikar","Barmer","Jhunjhunu","Nagaur","Chittorgarh","Churu","Dungarpur","Banswara","Sirohi","Jaisalmer","Dholpur"],
  "Sikkim": ["Gangtok","Namchi","Gyalshing","Mangan","Jorethang","Ravangla"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Erode","Tiruppur","Vellore","Thoothukudi","Thanjavur","Kanchipuram","Dindigul","Nagercoil","Cuddalore","Karur","Krishnagiri","Namakkal","Pudukkottai","Ramanathapuram","Nagapattinam","Mayiladuthurai","Virudhunagar"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam","Mahabubnagar","Nalgonda","Adilabad","Suryapet","Siddipet","Jagtial","Medak","Mancherial","Nagarkurnool","Nirmal","Sangareddy"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar","Kailasahar","Belonia","Khowai"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Varanasi","Agra","Prayagraj","Meerut","Ghaziabad","Noida","Mathura","Aligarh","Bareilly","Moradabad","Saharanpur","Gorakhpur","Faizabad","Jhansi","Muzaffarnagar","Bulandshahr","Rampur","Shahjahanpur","Firozabad","Etawah","Mirzapur","Sonbhadra","Rae Bareli","Lakhimpur Kheri","Sitapur","Hardoi","Bahraich","Gonda","Ballia","Jaunpur","Azamgarh","Mau","Deoria","Kushinagar","Maharajganj","Basti","Sultanpur","Hamirpur","Banda","Chitrakoot","Lalitpur","Farrukhabad","Kannauj","Pilibhit","Budaun"],
  "Uttarakhand": ["Dehradun","Haridwar","Rishikesh","Nainital","Roorkee","Haldwani","Rudrapur","Kashipur","Kotdwara","Almora","Chamoli","Pithoragarh","Tehri","Uttarkashi"],
  "West Bengal": ["Kolkata","Howrah","Asansol","Siliguri","Durgapur","Bardhaman","Haldia","Kharagpur","Malda","Baharampur","Darjeeling","Jalpaiguri","Cooch Behar","Krishnanagar","Balurghat","Bankura","Purulia","Midnapore","Contai","Raiganj"],
  "Delhi": ["New Delhi","North Delhi","South Delhi","East Delhi","West Delhi","Central Delhi","North East Delhi","North West Delhi","Shahdara","Dwarka","Rohini"],
  "Jammu & Kashmir": ["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Kathua","Udhampur","Rajouri","Pulwama","Kupwara","Bandipora","Kulgam","Ganderbal","Budgam","Poonch"],
  "Ladakh": ["Leh","Kargil","Diskit","Padum","Nubra"],
  "Chandigarh": ["Chandigarh"],
  "Dadra & Nagar Haveli and Daman & Diu": ["Silvassa","Daman","Diu"],
  "Lakshadweep": ["Kavaratti","Agatti","Minicoy"],
  "Puducherry": ["Puducherry","Karaikal","Mahe","Yanam"],
  "Andaman & Nicobar Islands": ["Port Blair","Havelock Island","Neil Island","Car Nicobar","Campbell Bay"],
};

const INDIA_STATES = Object.keys(INDIA_GEO).sort();

/* ══════════════════════════════════════════════════════════════════════════════
   OSM HELPERS
══════════════════════════════════════════════════════════════════════════════ */
function getFacilityName(tags: OSMTags): string {
  return tags["name:en"] ?? tags.name ?? "Unnamed facility";
}

function getFacilityType(tags: OSMTags): string {
  if (tags["healthcare:speciality"]) {
    return tags["healthcare:speciality"].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  if (tags.healthcare) return tags.healthcare.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  if (tags.amenity)    return tags.amenity.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return "Healthcare";
}

function getAddress(tags: OSMTags): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"] ?? tags["addr:district"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return parts.join(", ");
}

function getPhone(tags: OSMTags): string | null {
  return tags.phone ?? tags["contact:phone"] ?? null;
}

/* ══════════════════════════════════════════════════════════════════════════════
   MULTI-SELECT DISTRICT DROPDOWN
══════════════════════════════════════════════════════════════════════════════ */
function DistrictMultiSelect({
  districts, selected, onChange, disabled,
}: { districts: string[]; selected: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = districts.filter(d => d.toLowerCase().includes(search.toLowerCase()));
  const toggle = (d: string) =>
    onChange(selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d]);

  const label = disabled
    ? "Select a state first"
    : selected.length === 0 ? "All districts / cities"
    : selected.length === 1 ? selected[0]
    : `${selected.length} locations selected`;

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
        style={{
          background: "#fff", border: `1px solid ${open ? "#9D93C1" : "#E3E0EA"}`,
          color: disabled ? "#B3AAD0" : selected.length ? "#2A2830" : "#8B8894",
          boxShadow: open ? "0 0 0 3px rgba(157,147,193,.15)" : "0 1px 3px rgba(15,23,42,.04)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}>
        <div className="flex items-center gap-2 min-w-0">
          <MapPinned className="w-4 h-4 flex-shrink-0" style={{ color: disabled ? "#B3AAD0" : "#9D93C1" }} />
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "#EDEBF2", color: "#7C6FA0" }}>{selected.length}</span>
          )}
          <ChevronDown className="w-4 h-4" style={{ color: "#8B8894", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </div>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(d => (
            <span key={d} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#EDEBF2", color: "#7C6FA0", border: "1px solid #CBC5D9" }}>
              {d}
              <button type="button" onClick={() => toggle(d)} className="hover:opacity-70 leading-none">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button type="button" onClick={() => onChange([])}
            className="text-xs px-2 py-0.5 rounded-full transition-colors"
            style={{ color: "#8B8894", border: "1px solid #E3E0EA" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8B8894")}>
            Clear all
          </button>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #E3E0EA", boxShadow: "0 10px 30px rgba(15,23,42,.12)", maxHeight: "280px", display: "flex", flexDirection: "column" }}>
            <div className="p-2 border-b" style={{ borderColor: "#E3E0EA" }}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "#8B8894" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search districts…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
                  style={{ background: "#F7F6FA", color: "#2A2830", border: "1px solid #E3E0EA" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#9D93C1")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E3E0EA")} />
              </div>
            </div>
            <button type="button"
              onClick={() => onChange(selected.length === districts.length ? [] : [...districts])}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left transition-colors"
              style={{ color: "#7C6FA0", borderBottom: "1px solid #F7F6FA" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F7F6FA")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: selected.length === districts.length ? "#9D93C1" : "#EDEBF2", border: `1px solid ${selected.length === districts.length ? "#9D93C1" : "#CBC5D9"}` }}>
                {selected.length === districts.length && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              {selected.length === districts.length ? "Deselect all" : "Select all"}
              <span className="ml-auto font-normal" style={{ color: "#8B8894" }}>{districts.length}</span>
            </button>
            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "thin" }}>
              {filtered.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#8B8894" }}>No matches</p>}
              {filtered.map(d => {
                const checked = selected.includes(d);
                return (
                  <button type="button" key={d} onClick={() => toggle(d)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                    style={{ color: checked ? "#2A2830" : "#4A4750", background: checked ? "#FAF9FC" : "transparent" }}
                    onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "#F7F6FA"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = checked ? "#FAF9FC" : "transparent"; }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: checked ? "#9D93C1" : "#fff", border: `1.5px solid ${checked ? "#9D93C1" : "#CBC5D9"}` }}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {d}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FACILITY CARD
══════════════════════════════════════════════════════════════════════════════ */
function FacilityCard({ doc, idx }: { doc: IndiaDoctor; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const { tags } = doc;
  const name    = getFacilityName(tags);
  const type    = getFacilityType(tags);
  const address = getAddress(tags);
  const phone   = getPhone(tags);
  const isHospital  = (tags.amenity === "hospital" || tags.healthcare === "hospital");
  const isEmergency = tags.emergency === "yes";

  const lat = doc.lat ?? doc.center?.lat;
  const lon = doc.lon ?? doc.center?.lon;
  const mapsUrl = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}` : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.035, duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #E3E0EA", boxShadow: "0 1px 4px rgba(15,23,42,.05)" }}>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isHospital ? "#EFF6FF" : "#EDEBF2", border: `1px solid ${isHospital ? "#BFDBFE" : "#CBC5D9"}` }}>
            {isHospital
              ? <Building2 className="w-5 h-5" style={{ color: "#2563eb" }} />
              : <Heart className="w-5 h-5" style={{ color: "#7C6FA0" }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-sm leading-snug" style={{ color: "#2A2830" }}>{name}</h3>
              {isEmergency && (
                <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5"
                  style={{ background: "#FEE2E2", color: "#dc2626", border: "1px solid #FECACA" }}>
                  <Zap className="w-2.5 h-2.5" /> 24h
                </span>
              )}
            </div>
            <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-md capitalize"
              style={{ background: "#EDEBF2", color: "#7C6FA0", border: "1px solid #CBC5D9" }}>
              {type}
            </span>
            {address && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "#636262" }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9D93C1" }} />
                <span className="line-clamp-1">{address}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: "#636262" }}>
                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9D93C1" }} />
                {phone}
              </div>
            )}
          </div>
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "#8B8894" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F7F6FA")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <ChevronDown className="w-4 h-4" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
            style={{ borderTop: "1px solid #F7F6FA" }}>
            <div className="p-4 pt-3 space-y-2.5" style={{ background: "#FAFAFC" }}>
              {tags.opening_hours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9D93C1" }} />
                  <span style={{ color: "#4A4750" }}>{tags.opening_hours}</span>
                </div>
              )}
              {tags.operator && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#8B8894" }}>Operator</p>
                  <p className="text-sm" style={{ color: "#2A2830" }}>{tags.operator}</p>
                </div>
              )}
              {tags.beds && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#8B8894" }}>Beds</p>
                  <p className="text-sm" style={{ color: "#2A2830" }}>{tags.beds}</p>
                </div>
              )}
              {tags.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9D93C1" }} />
                  <a href={tags.website} target="_blank" rel="noopener noreferrer"
                    className="truncate underline underline-offset-2" style={{ color: "#7C6FA0" }}>
                    {tags.website}
                  </a>
                </div>
              )}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors mt-1"
                  style={{ background: "#EDEBF2", color: "#7C6FA0", border: "1px solid #CBC5D9" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#E0DBF0")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#EDEBF2")}>
                  <MapPin className="w-3 h-3" /> Open in Google Maps
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function DoctorsPage() {
  const [name, setName]           = useState("");
  const [specialty, setSpec]      = useState("");
  const [state, setState]         = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  const handleStateChange = (s: string) => { setState(s); setDistricts([]); };
  const availableDistricts = state ? (INDIA_GEO[state] ?? []) : [];
  const searchCities = districts.length > 0 ? districts : [];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QUERY_KEYS.indiaDoctors(name, specialty, state), districts, searchKey],
    queryFn: async () => {
      const targets = searchCities.length > 0 ? searchCities : [""]; // "" = whole state / all India

      const fetches = targets.map(async (city) => {
        const p = new URLSearchParams({ limit: "50" });
        if (name)       p.set("name", name);
        if (specialty)  p.set("specialty", specialty);
        if (city)       p.set("city", city);
        else if (state) p.set("state", state);
        const res = await fetch(`/api/doctors?${p.toString()}`);
        if (!res.ok) return [] as IndiaDoctor[];
        const json = await res.json();
        return (json.elements ?? []) as IndiaDoctor[];
      });

      const results = await Promise.all(fetches);
      const seen = new Set<number>();
      const merged: IndiaDoctor[] = [];
      for (const batch of results) {
        for (const doc of batch) {
          if (!seen.has(doc.id)) { seen.add(doc.id); merged.push(doc); }
        }
      }
      return merged.sort((a, b) => {
        const na = getFacilityName(a.tags) === "Unnamed facility" ? 1 : 0;
        const nb = getFacilityName(b.tags) === "Unnamed facility" ? 1 : 0;
        return na - nb;
      });
    },
    enabled: submitted,
    staleTime: 60_000,
  });

  const facilities: IndiaDoctor[] = data ?? [];
  const busy = isLoading || isFetching;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSearchKey(k => k + 1);
  };

  const handleClear = () => { setName(""); setSpec(""); handleStateChange(""); setSubmitted(false); };

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFC" }}>
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#2A2830" }}>Find Doctors</h1>
          <p className="text-sm" style={{ color: "#8B8894" }}>
            Search real hospitals, clinics, and specialists across India · powered by OpenStreetMap
          </p>
        </motion.div>

        {/* Search form */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4 }}
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#fff", border: "1px solid #E3E0EA", boxShadow: "0 1px 6px rgba(15,23,42,.05)" }}>

          <form onSubmit={handleSearch} className="space-y-4">
            {/* Row 1 — name + specialty */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#636262" }}>
                  Doctor / Hospital Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B8894" }} />
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Apollo, AIIMS, Fortis…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "#F7F6FA", border: "1px solid #E3E0EA", color: "#2A2830" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#9D93C1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(157,147,193,.15)"; e.currentTarget.style.background = "#fff"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E3E0EA"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#F7F6FA"; }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#636262" }}>
                  Specialty / Type
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: "#8B8894" }} />
                  <select value={specialty} onChange={e => setSpec(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none transition-all"
                    style={{ background: "#F7F6FA", border: "1px solid #E3E0EA", color: specialty ? "#2A2830" : "#8B8894", cursor: "pointer" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#9D93C1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(157,147,193,.15)"; e.currentTarget.style.background = "#fff"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E3E0EA"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#F7F6FA"; }}>
                    {SPECIALTIES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B8894" }} />
                </div>
              </div>
            </div>

            {/* Row 2 — state + districts */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#636262" }}>
                  State / Union Territory
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: "#8B8894" }} />
                  <select value={state} onChange={e => handleStateChange(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none transition-all"
                    style={{ background: "#F7F6FA", border: "1px solid #E3E0EA", color: state ? "#2A2830" : "#8B8894", cursor: "pointer" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#9D93C1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(157,147,193,.15)"; e.currentTarget.style.background = "#fff"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#E3E0EA"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#F7F6FA"; }}>
                    <option value="">All states</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#8B8894" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#636262" }}>
                  District / City
                  {districts.length > 0 && (
                    <span className="ml-1.5 font-normal normal-case" style={{ color: "#9D93C1" }}>— {districts.length} selected</span>
                  )}
                </label>
                <DistrictMultiSelect
                  districts={availableDistricts}
                  selected={districts}
                  onChange={setDistricts}
                  disabled={!state}
                />
              </div>
            </div>

            {/* Active filter chips */}
            {(state || name || specialty) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-medium" style={{ color: "#8B8894" }}>Active filters:</span>
                {name && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#EDEBF2", color: "#7C6FA0", border: "1px solid #CBC5D9" }}>
                    {name}
                    <button type="button" onClick={() => setName("")} className="hover:opacity-70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {specialty && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#EDEBF2", color: "#7C6FA0", border: "1px solid #CBC5D9" }}>
                    <Stethoscope className="w-2.5 h-2.5" /> {specialty}
                    <button type="button" onClick={() => setSpec("")} className="hover:opacity-70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
                {state && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#EDEBF2", color: "#7C6FA0", border: "1px solid #CBC5D9" }}>
                    <MapPin className="w-2.5 h-2.5" /> {state}
                    <button type="button" onClick={() => handleStateChange("")} className="hover:opacity-70"><X className="w-2.5 h-2.5" /></button>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={busy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg,#9D93C1,#7C6FA0)",
                  color: "#fff",
                  boxShadow: "0 4px 14px rgba(157,147,193,.35)",
                  opacity: busy ? 0.7 : 1,
                }}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search Doctors
              </button>
              {(submitted || name || specialty || state) && (
                <button type="button" onClick={handleClear}
                  className="text-sm font-medium transition-colors px-3 py-2 rounded-lg"
                  style={{ color: "#8B8894" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2A2830")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#8B8894")}>
                  Clear all
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Loading */}
        {busy && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#9D93C1" }} />
            <p className="text-sm" style={{ color: "#8B8894" }}>
              Searching{districts.length > 1 ? ` across ${districts.length} locations` : ""}…
            </p>
          </div>
        )}

        {/* Not yet searched */}
        {!submitted && !busy && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EDEBF2" }}>
              <Filter className="w-7 h-7" style={{ color: "#9D93C1" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#2A2830" }}>Search for healthcare providers</p>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#8B8894" }}>
              Select a specialty and/or a city to find real hospitals and clinics near you.
              You can narrow down by multiple districts at once.
            </p>
          </motion.div>
        )}

        {/* No results */}
        {!busy && submitted && facilities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EDEBF2" }}>
              <Stethoscope className="w-7 h-7" style={{ color: "#9D93C1" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "#2A2830" }}>No providers found</p>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#8B8894" }}>
              Try searching by name (e.g. "Apollo", "AIIMS", "Fortis") or selecting a larger city.
              Not all facilities are mapped in smaller towns.
            </p>
          </div>
        )}

        {/* Results */}
        {!busy && facilities.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: "#4A4750" }}>
                {facilities.length} provider{facilities.length !== 1 ? "s" : ""} found
                {districts.length > 0 && (
                  <span className="ml-1.5 text-xs" style={{ color: "#8B8894" }}>
                    · {districts.join(", ")}
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-2.5">
              {facilities.map((doc, i) => <FacilityCard key={doc.id} doc={doc} idx={i} />)}
            </div>
          </motion.div>
        )}

        <p className="text-xs text-center mt-10" style={{ color: "#B3AAD0" }}>
          Data sourced from OpenStreetMap contributors · For informational purposes only
        </p>
      </div>
    </div>
  );
}
