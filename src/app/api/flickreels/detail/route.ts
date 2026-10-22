// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlTitle } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const playletId = request.nextUrl.searchParams.get("playletId");
    if (!playletId) {
      return encryptedResponse({ success: false, error: "playletId is required" }, 400);
    }
    const data = await dlTitle("flickreels", playletId);
    return encryptedResponse({
      success: true,
      playletId: data.id,
      title: data.title,
      cover: data.cover,
      description: data.synopsis || "",
      totalEpisodes: data.totalEpisodes,
      labels: data.tags || [],
      episodes: (data.episodes || []).map((ep) => ({
        id: ep.episodeId,
        name: `Episode ${ep.episodeNo}`,
        num: ep.episodeNo,
        unlock: !ep.isLocked,
        duration: ep.duration || 0,
      })),
    });
  } catch (error) {
    console.error("FlickReels Detail (dramaletto) Error:", error);
    return encryptedResponse({ success: false, error: "Internal server error" });
  }
}
