/* ── Auth / User ─────────────────────────────────────────────────────────── */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin";
  date_of_birth: string | null;
  phone: string | null;
  blood_group: string | null;
  gender: string | null;
  address: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

/* ── Vitals / Records ────────────────────────────────────────────────────── */
export interface VitalSign {
  id: string;
  patient_id: string;
  recorded_at: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  heart_rate: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  glucose_mmol: number | null;
  spo2_pct: number | null;
  temp_celsius: number | null;
  notes: string | null;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  generic_name: string | null;
  dosage: string | null;
  unit: string | null;
  frequency: string | null;
  route: string | null;
  start_date: string | null;
  end_date: string | null;
  prescriber: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Allergy {
  id: string;
  patient_id: string;
  substance: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  reaction_type: string | null;
  onset_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface MedicalHistory {
  id: string;
  patient_id: string;
  condition: string;
  icd10_code: string | null;
  onset_date: string | null;
  resolution_date: string | null;
  status: "active" | "resolved" | "chronic" | "remission";
  notes: string | null;
  created_at: string;
}

export interface HealthSummary {
  latest_vitals: Record<string, number | string | null> | null;
  active_medications: Array<{ name: string; dosage: string | null; frequency: string | null; id: string }>;
  allergies: Array<{ substance: string; severity: string; id: string }>;
  active_conditions: Array<{ condition: string; status: string; icd10_code: string | null; id: string }>;
  vital_count: number;
}

/* ── Chat ────────────────────────────────────────────────────────────────── */
export interface ChatSession {
  id: string;
  title: string;
  is_archived: boolean;
  created_at: string;
  last_updated: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  image_data: string | null;  // base64 data URI; present on user messages that included an image
  model_used: string | null;
  extracted_entities: Record<string, unknown> | null;
  rag_sources: string[] | null;
  rag_grounding: "grounded" | "no_match" | "unavailable" | null;
  created_at: string;
}

/* ── Documents ───────────────────────────────────────────────────────────── */
export interface Document {
  id: string;
  patient_id: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number | null;
  document_type: string | null;
  processing_status: "pending" | "processing" | "completed" | "failed";
  processing_error: string | null;
  ai_summary: {
    document_type?: string;
    key_findings?: string[];
    medications_found?: Array<{ name: string; dosage?: string; frequency?: string }>;
    values_found?: Array<{ test_name: string; value: string; unit?: string; reference_range?: string; status?: string }>;
    recommended_actions?: string[];
    urgency?: "routine" | "soon" | "urgent";
    summary?: string;
  } | null;
  entities_extracted: {
    diseases?: string[];
    chemicals?: string[];
    negated_terms?: string[];
  } | null;
  uploaded_at: string;
  processed_at: string | null;
}

/* ── Appointments ────────────────────────────────────────────────────────── */
export interface Appointment {
  id: string;
  doctor_name: string;
  speciality: string | null;
  appointment_dt: string;
  location: string | null;
  notes: string | null;
  ai_prep_notes: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

/* ── Analytics ───────────────────────────────────────────────────────────── */
export interface HealthScore {
  score: number;
  grade: string;
  breakdown: Record<string, { value: number; score: number; status: string; range: string }>;
  computed_at: string;
}

export interface AIInsight {
  title: string;
  body: string;
  severity: "info" | "warning" | "positive";
  category: string;
}

/* ── Doctors (OpenStreetMap / Overpass API — India) ─────────────────────── */

/** Tags on an OSM element that are relevant to healthcare facilities */
export interface OSMTags {
  name?: string;
  "name:en"?: string;
  amenity?: string;
  healthcare?: string;
  "healthcare:speciality"?: string;
  specialty?: string;
  operator?: string;
  "addr:housenumber"?: string;
  "addr:street"?: string;
  "addr:city"?: string;
  "addr:district"?: string;
  "addr:state"?: string;
  "addr:postcode"?: string;
  phone?: string;
  "contact:phone"?: string;
  website?: string;
  opening_hours?: string;
  emergency?: string;
  beds?: string;
  [key: string]: string | undefined;
}

/** A single result element from the Overpass API */
export interface IndiaDoctor {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: OSMTags;
}

// Keep NPIDoctor alias for legacy references (unused after doctors page rewrite)
export interface NPIAddress {
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  telephone_number?: string;
  address_purpose?: string;
}
export interface NPITaxonomy { code: string; desc: string; primary: boolean; state?: string; license?: string; }
export interface NPIDoctor {
  number: string;
  basic: { first_name?: string; last_name?: string; middle_name?: string; credential?: string; gender?: string; sole_proprietor?: string; organization_name?: string; };
  addresses: NPIAddress[];
  taxonomies: NPITaxonomy[];
}

/* ── Pharmacy / Drugs (OpenFDA) ──────────────────────────────────────────── */
export interface DrugLabel {
  id: string;
  openfda: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    product_type?: string[];
    route?: string[];
    substance_name?: string[];
    application_number?: string[];
  };
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  warnings?: string[];
  drug_interactions?: string[];
  contraindications?: string[];
  description?: string[];
  purpose?: string[];
}

export interface DrugInteractionLabel {
  name: string;
  brand: string | null;
  generic: string | null;
  interactions: string | null;
  warnings: string | null;
}

export interface DrugInteractionResult {
  drugA: DrugInteractionLabel | null;
  drugB: DrugInteractionLabel | null;
  crossMentions: {
    aWarnsAboutB: boolean;
    bWarnsAboutA: boolean;
    flagged: boolean;
  };
}

/* ── Wellness ────────────────────────────────────────────────────────────── */
export interface WellnessEntry {
  id: string;
  patient_id: string;
  date: string;
  category: "fitness" | "nutrition" | "sleep" | "hydration" | "stress" | "meditation";
  value: number;
  unit: string;
  notes: string | null;
  created_at: string;
}

/* ── Specialties ─────────────────────────────────────────────────────────── */
export interface Specialty {
  id: string;
  name: string;
  iconKey: string;
  colorClass: string;
  description: string;
  symptoms: string[];
  commonTests: string[];
}
