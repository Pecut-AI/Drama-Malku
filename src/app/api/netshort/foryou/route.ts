// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlBrowse } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get("page") || "1";
    const items = await dlBrowse("netshort", page);
    const dramas = (items || []).map((item) => ({
      shortPlayId: item.id,
      shortPlayLibraryId: item.id,
      title: item.title,
      cover: item.cover || item.poster,
      labels: item.tags || [],
      heatScore: item.heat ? String(item.heat) : "",
      scriptName: undefined,
      totalEpisodes: item.totalEpisodes || 0,
    }));
    return encryptedResponse({
      success: true,
      data: dramas,
      completed: dramas.length === 0,
    });
  } catch (error) {
    console.error("NetShort ForYou (dramaletto) Error:", error);
    return encryptedResponse({ success: false, data: [] });
  }
}
