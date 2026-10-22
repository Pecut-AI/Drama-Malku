// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlSearch } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query");
    if (!query) return encryptedResponse({ success: true, data: [] });
    const items = await dlSearch("vibeshort", query);
    const results = (items || []).map((item) => ({
      shortPlayId: item.id,
      shortPlayLibraryId: item.id,
      title: item.title,
      cover: item.cover || item.poster,
      labels: item.tags || [],
      heatScore: item.heat ? String(item.heat) : "",
      description: "",
      totalEpisodes: item.totalEpisodes || 0,
    }));
    return encryptedResponse({ success: true, data: results });
  } catch (error) {
    console.error("VibeShort Search (dramaletto) Error:", error);
    return encryptedResponse({ success: true, data: [] });
  }
}
