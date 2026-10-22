// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlSearch } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query");
    if (!query) return encryptedResponse({ success: true, data: [] });
    const items = await dlSearch("shortmax", query);
    const results = (items || []).map((item) => ({
      shortPlayId: parseInt(item.id, 10) || 0,
      shortPlayCode: parseInt(item.id, 10) || 0,
      title: item.title,
      cover: item.cover || item.poster,
      genre: item.tags || [],
    }));
    return encryptedResponse({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error("ShortMax Search (dramaletto) Error:", error);
    return encryptedResponse({ success: true, data: [] });
  }
}
