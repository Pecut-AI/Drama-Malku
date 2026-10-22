// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { dlHome } from "@/lib/dramaletto";
import { gsRankPayload } from "@/lib/goodshort-shape";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sections = await dlHome("goodshort");
    const items = (sections || []).flatMap((s) => s.items || []);
    const seen = new Set<string>();
    const dedup = items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
    return encryptedResponse(gsRankPayload("Trending", dedup));
  } catch (error) {
    console.error("GoodShort Trending (dramaletto) Error:", error);
    return encryptedResponse(
      { status: 500, message: "Failed to fetch from GoodShort", data: null },
      500
    );
  }
}
