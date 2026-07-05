import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q     = searchParams.get("q") ?? "";
  const limit = searchParams.get("limit") ?? "10";

  if (!q.trim()) return NextResponse.json({ results: [] });

  const search = `(openfda.brand_name:"${q}" OR openfda.generic_name:"${q}" OR openfda.substance_name:"${q}")`;

  try {
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(search)}&limit=${limit}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();
    return NextResponse.json({ results: data.results ?? [] });
  } catch {
    return NextResponse.json({ error: "OpenFDA unavailable" }, { status: 502 });
  }
}
