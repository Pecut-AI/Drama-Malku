// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlTitle } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const shortPlayId = request.nextUrl.searchParams.get("shortPlayId");
    if (!shortPlayId) {
      return encryptedResponse({ success: false, error: "shortPlayId is required" }, 400);
    }
    const data = await dlTitle("netshort", shortPlayId);
    return encryptedResponse({
      success: true,
      shortPlayId: data.id,
      shortPlayLibraryId: data.id,
      title: data.title,
      cover: data.cover,
      description: data.synopsis || "",
      labels: data.tags || [],
      totalEpisodes: data.totalEpisodes,
      isFinish: data.finished === true,
      payPoint: 0,
      heatScore: "",
      episodes: (data.episodes || []).map((ep) => ({
        episodeId: ep.episodeId,
        episodeNo: ep.episodeNo,
        cover: ep.cover,
        isLock: ep.isLocked,
        likeNums: "",
      })),
    });
  } catch (error) {
    console.error("NetShort Detail (dramaletto) Error:", error);
    return encryptedResponse({ success: false, error: "Internal server error" });
  }
}
