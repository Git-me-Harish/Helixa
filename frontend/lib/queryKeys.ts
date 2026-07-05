/**
 * Centralised React Query key factory.
 * Import QUERY_KEYS and use these instead of inline string arrays so that
 * invalidation calls across different pages always target the same cache entries.
 */
export const QUERY_KEYS = {
  // Auth / profile
  profile: () => ["profile"] as const,

  // Health records
  healthSummary: () => ["health-summary"] as const,
  healthScore:   () => ["health-score"] as const,
  insights:      (days: number) => ["insights", days] as const,
  vitalTrends:   (days: number) => ["vital-trends", days] as const,

  // Records
  vitals:         () => ["vitals"] as const,
  medications:    () => ["medications"] as const,
  allergies:      () => ["allergies"] as const,
  medicalHistory: () => ["medical-history"] as const,

  // Documents
  documents:   () => ["documents"] as const,
  docStatus:   (id: string) => ["doc-status", id] as const,

  // Appointments
  appointments: () => ["appointments"] as const,

  // Chat
  chatSessions:  () => ["chat-sessions"] as const,
  chatSession:   (id: string | null) => ["chat-session", id] as const,

  // Wellness / extended records
  wellness:         () => ["wellness"] as const,
  symptoms:         () => ["symptoms"] as const,
  vaccinations:     () => ["vaccinations"] as const,
  soapNotes:        () => ["soap-notes"] as const,
  treatmentPlans:   () => ["treatment-plans"] as const,
  insurance:        () => ["insurance"] as const,
  emergencyContacts:() => ["emergency-contacts"] as const,
  family:           () => ["family"] as const,
  timeline:         () => ["timeline"] as const,

  // Discovery
  npiDoctors: (name: string, specialty: string, state: string) =>
    ["npi-doctors", name, specialty, state] as const,
  drugs:          (query: string) => ["drugs", query] as const,
  drugInteraction:(a: string, b: string) => ["drug-interaction", a, b] as const,
} as const;
