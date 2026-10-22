// Upstream: dramaletto.com — tiket stream diminta server-side, video
// dialirkan lewat proxy DramaMalku (/api/dramaletto/proxy?mode=video).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlTicket, dlProxyUrl } from "@/lib/dramaletto";

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
    const { data: ticket } = await dlTicket("netshort", shortPlayId, epNo);
    const sub = ticket.subtitles?.[0];
    return encryptedResponse({
      success: true,
      shortPlayId,
      episode: {
        episodeId: `${shortPlayId}-${epNo}`,
        episodeNo: epNo,
        videoUrl: dlProxyUrl("netshort", "video", shortPlayId, epNo),
        quality: ticket.clarity || "720p",
        sdkVid: null,
        subtitleUrl: sub
          ? dlProxyUrl("netshort", "subtitle", shortPlayId, epNo, `&index=${sub.index}`)
          : null,
        subtitleLanguage: sub ? sub.lang : null,
        unlockType: null,
      },
      isMember: 0,
    });
  } catch (error) {
    console.error("NetShort Episode (dramaletto) Error:", error);
    return encryptedResponse({ success: false, error: "Internal server error" });
  }
}
