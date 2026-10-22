// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get("page") || "1";
    const items = await dlBrowse("shortmax", page);
    const dramas = (items || []).map(mapShort);
    return encryptedResponse({
      success: true,
      data: dramas,
      page: Number(page),
      isEnd: dramas.length === 0,
      total: dramas.length,
    });
  } catch (error) {
    console.error("ShortMax ForYou (dramaletto) Error:", error);
    return encryptedResponse({ success: false, data: [], isEnd: true });
  }
}
