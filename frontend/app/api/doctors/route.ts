import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name        = searchParams.get("name") ?? "";
  const specialty   = searchParams.get("specialty") ?? "";
  const city        = searchParams.get("city") ?? "";
  const state       = searchParams.get("state") ?? "";
  const limit       = searchParams.get("limit") ?? "20";

  const params = new URLSearchParams({
    version: "2.1",
    limit,
    pretty: "true",
  });

  if (name)      params.set("name", name);
  if (specialty) params.set("taxonomy_description", specialty);
  if (city)      params.set("city", city);
  if (state)     params.set("state", state);

  try {
    const res = await fetch(
      `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "NPI registry unavailable" }, { status: 502 });
  }
}
