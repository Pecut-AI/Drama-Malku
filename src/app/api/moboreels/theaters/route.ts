// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { dlHome, type DlItem } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

function mapDrama(item: DlItem) {
  return {
    shortPlayId: item.id,
    shortPlayLibraryId: item.id,
    title: item.title,
    cover: item.cover || item.poster,
    labels: item.tags || [],
    heatScore: item.heat ? String(item.heat) : "",
    scriptName: undefined,
    totalEpisodes: item.totalEpisodes || 0,
  };
}

export async function GET() {
  try {
    const sections = await dlHome("moboreels");
    const groups = (sections || []).map((s) => ({
      groupId: s.id,
      groupName: s.title,
      contentRemark: "",
      dramas: (s.items || []).map(mapDrama),
    }));
    return encryptedResponse({ success: true, data: groups });
  } catch (error) {
    console.error("MoboReels Theaters (dramaletto) Error:", error);
    return encryptedResponse({ success: false, data: [] });
  }
}
