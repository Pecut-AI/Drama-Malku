// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlBrowse, type DlItem } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

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

export async function GET(_request: NextRequest) {
  try {
    const items = await dlBrowse("flickreels", 1);
    const dramas = (items || []).map(mapFlick);
    return encryptedResponse({ success: true, data: dramas, total: dramas.length });
  } catch (error) {
    console.error("FlickReels Latest (dramaletto) Error:", error);
    return encryptedResponse({ success: false, data: [], total: 0 });
  }
}
