// Upstream: dramaletto.com (platform ditambahkan 23 Okt 2026 atas
// perintah Elnath; sumbernya memang dramaletto sejak awal di DramaMalku).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlEpisodeStream } from "@/lib/dramaletto";

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
    const stream = await dlEpisodeStream("dramawave", shortPlayId, epNo, request.nextUrl.origin);
    return encryptedResponse({
      success: true,
      shortPlayId,
      episode: {
        episodeId: `${shortPlayId}-${epNo}`,
        episodeNo: epNo,
        videoUrl: stream.videoUrl,
        quality: stream.quality,
        sdkVid: null,
        subtitleUrl: stream.subtitleUrl,
        subtitleLanguage: stream.subtitleLanguage,
        unlockType: null,
      },
      isMember: 0,
    });
  } catch (error) {
    console.error("DramaWave Episode (dramaletto) Error:", error);
    return encryptedResponse({ success: false, error: "Internal server error" });
  }
}
