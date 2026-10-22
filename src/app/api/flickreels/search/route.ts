// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlSearch } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query");
    if (!query || !query.trim()) {
      return encryptedResponse({ success: true, data: [] });
    }
    const items = await dlSearch("flickreels", query);
    const results = (items || []).map((item) => ({
      playletId: parseInt(item.id, 10) || 0,
      title: item.title,
      cover: item.cover || item.poster,
      totalEpisodes: item.totalEpisodes || 0,
      tags: item.tags || [],
      description: "",
    }));
    return encryptedResponse({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error("FlickReels Search (dramaletto) Error:", error);
    return encryptedResponse({ success: true, data: [], total: 0 });
  }
}
