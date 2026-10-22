// Upstream: dramaletto.com — stream HLS bertiket, playlist dialirkan
// lewat proxy DramaMalku (/api/dramaletto/proxy?mode=playlist).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlTicket, dlTitle, dlProxyUrl } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const shortPlayId = request.nextUrl.searchParams.get("shortPlayId");
    const episodeNumber = request.nextUrl.searchParams.get("episodeNumber");
    if (!shortPlayId || !episodeNumber) {
      return encryptedResponse(
        { success: false, error: "shortPlayId and episodeNumber are required" },
        400
      );
    }
    const epNo = parseInt(episodeNumber, 10);
    await dlTicket("shortmax", shortPlayId, epNo);
    const title = await dlTitle("shortmax", shortPlayId).catch(() => null);
    const epInfo = title?.episodes?.find((e) => e.episodeNo === epNo);
    const playlist =
      dlProxyUrl("shortmax", "playlist", shortPlayId, epNo) + "&file=main.m3u8";
    return encryptedResponse({
      success: true,
      shortPlayId: parseInt(shortPlayId, 10) || 0,
      shortPlayName: title?.title || "",
      totalEpisodes: title?.totalEpisodes || 0,
      episode: {
        episodeNum: epNo,
        id: epInfo ? parseInt(epInfo.episodeId, 10) || epNo : epNo,
        duration: epInfo?.duration || 0,
        locked: epInfo ? epInfo.isLocked : false,
        cover: epInfo?.cover || title?.cover || "",
        videoUrl: { video_720: playlist },
      },
    });
  } catch (error) {
    console.error("ShortMax Episode (dramaletto) Error:", error);
    return encryptedResponse({ success: false, error: "Internal server error" });
  }
}
