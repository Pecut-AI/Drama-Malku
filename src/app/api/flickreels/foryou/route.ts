// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlBrowse, type DlItem } from "@/lib/dramaletto";

function mapFlick(item: DlItem) {
  return {
    playletId: parseInt(item.id, 10) || 0,
    title: item.title,
    cover: item.cover || item.poster,
    totalEpisodes: item.totalEpisodes || 0,
    hotNum: item.heat ? String(item.heat) : "",
    tags: item.tags || [],
  };
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get("page") || "1";
    const items = await dlBrowse("flickreels", page);
    const dramas = (items || []).map(mapFlick);
    return encryptedResponse({
      success: true,
      data: dramas,
      page: Number(page),
      isEnd: dramas.length === 0,
      total: dramas.length,
    });
  } catch (error) {
    console.error("FlickReels ForYou (dramaletto) Error:", error);
    return encryptedResponse({ success: false, data: [], page: 1, isEnd: true, total: 0 });
  }
}
