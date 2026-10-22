// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { dlHome, type DlItem } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

function mapShort(item: DlItem) {
  return {
    shortPlayId: parseInt(item.id, 10) || 0,
    title: item.title,
    cover: item.cover || item.poster,
    totalEpisodes: item.totalEpisodes || 0,
    label: (item.tags || [])[0] || "",
    collectNum: 0,
    playNum: item.heat || 0,
    summary: "",
  };
}

export async function GET() {
  try {
    const sections = await dlHome("shortmax");
    const items = (sections || []).flatMap((s) => s.items || []);
    // dedup per id
    const seen = new Set<string>();
    const dramas = items
      .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
      .map(mapShort);
    return encryptedResponse({ success: true, data: dramas, total: dramas.length });
  } catch (error) {
    console.error("ShortMax Rekomendasi (dramaletto) Error:", error);
    return encryptedResponse({ success: false, data: [] });
  }
}
