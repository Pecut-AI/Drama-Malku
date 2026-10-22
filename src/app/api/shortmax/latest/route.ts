// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { dlBrowse, type DlItem } from "@/lib/dramaletto";

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
    const items = await dlBrowse("shortmax", 1);
    const dramas = (items || []).map(mapShort);
    return encryptedResponse({ success: true, data: dramas, total: dramas.length });
  } catch (error) {
    console.error("ShortMax Latest (dramaletto) Error:", error);
    return encryptedResponse({ success: false, data: [] });
  }
}
