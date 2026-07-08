import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to the OpenStreetMap Overpass API.
 * Returns real healthcare facilities (hospitals, clinics, doctors) in India
 * filtered by city/district and optionally healthcare type / name.
 *
 * Overpass API is public, free, and has genuine Indian data.
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Map our specialty slugs → OSM healthcare / amenity values
const SPECIALTY_TO_OSM: Record<string, string[]> = {
  "General Practice":              ["amenity=clinic", "amenity=doctors"],
  "Hospital":                      ["amenity=hospital"],
  "Pharmacy":                      ["amenity=pharmacy"],
  "Cardiology":                    ["healthcare:speciality=cardiology"],
  "Neurology":                     ["healthcare:speciality=neurology"],
  "Orthopaedics":                  ["healthcare:speciality=orthopaedics"],
  "Dermatology":                   ["healthcare:speciality=dermatology"],
  "Paediatrics":                   ["healthcare:speciality=paediatrics"],
  "Gynaecology":                   ["healthcare:speciality=gynaecology"],
  "Ophthalmology":                 ["healthcare:speciality=ophthalmology"],
  "ENT":                           ["healthcare:speciality=ent"],
  "Psychiatry":                    ["healthcare:speciality=psychiatry"],
  "Dentistry":                     ["amenity=dentist"],
  "Radiology":                     ["healthcare:speciality=radiology"],
  "Oncology":                      ["healthcare:speciality=oncology"],
  "Endocrinology":                 ["healthcare:speciality=endocrinology"],
  "Gastroenterology":              ["healthcare:speciality=gastroenterology"],
  "Nephrology":                    ["healthcare:speciality=nephrology"],
  "Pulmonology":                   ["healthcare:speciality=pulmonology"],
  "Urology":                       ["healthcare:speciality=urology"],
  "Ayurveda":                      ["amenity=clinic", "healthcare:speciality=ayurveda"],
  "Homoeopathy":                   ["healthcare:speciality=homoeopathy"],
  "Physiotherapy":                 ["healthcare:speciality=physiotherapy"],
};

function buildQuery(city: string, specialty: string, name: string): string {
  // We always search in India (ISO 3166 code "IN")
  // Area search: find the named city/district area node, then look inside it.
  const areaLookup = city
    ? `area[name~"${city}",i][admin_level~"^[4-9]$"]["ISO3166-2"~"^IN"]->.searchArea;`
    : `area["ISO3166-1"="IN"]["admin_level"="2"]->.searchArea;`;

  const osmValues = specialty && SPECIALTY_TO_OSM[specialty]
    ? SPECIALTY_TO_OSM[specialty]
    : [
        'amenity=hospital',
        'amenity=clinic',
        'amenity=doctors',
        'amenity=dentist',
        'healthcare=doctor',
        'healthcare=clinic',
        'healthcare=hospital',
      ];

  const nameFilter = name ? `[name~"${name}",i]` : "";

  const nodeLines = osmValues
    .map((v) => {
      const [k, val] = v.split("=");
      return `node["${k}"="${val}"]${nameFilter}(area.searchArea);
way["${k}"="${val}"]${nameFilter}(area.searchArea);`;
    })
    .join("\n");

  return `[out:json][timeout:20];
${areaLookup}
(
${nodeLines}
);
out body center 50;`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name      = (searchParams.get("name") ?? "").trim();
  const specialty = (searchParams.get("specialty") ?? "").trim();
  const city      = (searchParams.get("city") ?? "").trim();

  const query = buildQuery(city, specialty, name);

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Overpass API error", elements: [] }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ elements: data.elements ?? [] });
  } catch {
    return NextResponse.json({ error: "Data source unavailable", elements: [] }, { status: 502 });
  }
}
