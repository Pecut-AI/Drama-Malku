// Upstream: dramaletto.com — dramaletto memberi stream HLS bertiket;
// playlist dialirkan lewat proxy DramaMalku (/api/dramaletto/proxy).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlTicket, dlTitle, dlProxyUrl } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const playletId = request.nextUrl.searchParams.get("playletId");
    const episodeNumber = request.nextUrl.searchParams.get("episodeNumber");
    if (!playletId || !episodeNumber) {
      return encryptedResponse(
        { success: false, error: "playletId and episodeNumber are required" },
        400
      );
    }
    const epNo = parseInt(episodeNumber, 10);
    // Minta tiket untuk memastikan episode memang bisa diputar di dramaletto.
    await dlTicket("flickreels", playletId, epNo);
    const title = await dlTitle("flickreels", playletId).catch(() => null);
    return encryptedResponse({
      success: true,
      playletId,
      title: title?.title || "",
      episodeTitle: `Episode ${epNo}`,
      episodeNumber: epNo,
      totalDuration: 0,
      hlsUrl:
        dlProxyUrl("flickreels", "playlist", playletId, epNo) + "&file=main.m3u8",
    });
  } catch (error) {
    console.error("FlickReels Episode (dramaletto) Error:", error);
    return encryptedResponse({ success: false, error: "Internal server error" });
  }
}
