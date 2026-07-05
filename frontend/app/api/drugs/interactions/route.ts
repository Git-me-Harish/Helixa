import { NextRequest, NextResponse } from "next/server";

async function fetchDrugLabel(name: string): Promise<{
  name: string;
  brand: string | null;
  generic: string | null;
  interactions: string | null;
  warnings: string | null;
} | null> {
  const search = `(openfda.brand_name:"${name}" OR openfda.generic_name:"${name}" OR openfda.substance_name:"${name}")`;
  try {
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(search)}&limit=1`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;
    return {
      name,
      brand: result.openfda?.brand_name?.[0] ?? null,
      generic: result.openfda?.generic_name?.[0] ?? null,
      interactions: result.drug_interactions?.[0] ?? null,
      warnings: result.warnings?.[0] ?? null,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const drugA = searchParams.get("a")?.trim();
  const drugB = searchParams.get("b")?.trim();

  if (!drugA || !drugB) {
    return NextResponse.json({ error: "Two drug names required (a= and b=)" }, { status: 400 });
  }

  const [labelA, labelB] = await Promise.all([
    fetchDrugLabel(drugA),
    fetchDrugLabel(drugB),
  ]);

  // Search for cross-mentions: does drug A's label mention drug B, and vice versa?
  const genericB = labelB?.generic?.toLowerCase() ?? drugB.toLowerCase();
  const brandB   = labelB?.brand?.toLowerCase()   ?? "";
  const genericA = labelA?.generic?.toLowerCase() ?? drugA.toLowerCase();
  const brandA   = labelA?.brand?.toLowerCase()   ?? "";

  const aMentionsB =
    (labelA?.interactions ?? "").toLowerCase().includes(genericB) ||
    (brandB && (labelA?.interactions ?? "").toLowerCase().includes(brandB));

  const bMentionsA =
    (labelB?.interactions ?? "").toLowerCase().includes(genericA) ||
    (brandA && (labelB?.interactions ?? "").toLowerCase().includes(brandA));

  return NextResponse.json({
    drugA: labelA,
    drugB: labelB,
    crossMentions: {
      aWarnsAboutB: aMentionsB,
      bWarnsAboutA: bMentionsA,
      flagged: aMentionsB || bMentionsA,
    },
  });
}
