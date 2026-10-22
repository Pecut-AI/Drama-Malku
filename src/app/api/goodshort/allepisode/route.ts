// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
// Halaman watch GoodShort membaca data.downloadList[].multiVideos[] —
// filePath diisi penanda "dramaletto:<bookId>:<episodeNo>" yang dikenali
// oleh /api/goodshort/stream-proxy versi dramaletto.
import { NextRequest } from "next/server";
import { encryptedResponse } from "@/lib/api-utils";
import { dlTitle } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const bookId = req.nextUrl.searchParams.get("bookId");
    if (!bookId) {
      return encryptedResponse({ status: 400, message: "bookId is required", data: null }, 400);
    }
    const data = await dlTitle("goodshort", bookId);
    return encryptedResponse({
      data: {
        bookName: data.title,
        downloadList: (data.episodes || []).map((ep) => ({
          chapterId: ep.episodeId,
          chapterIndex: ep.episodeNo,
          multiVideos: [
            { type: "720p", filePath: `dramaletto:${bookId}:${ep.episodeNo}` },
          ],
        })),
      },
      status: 200,
      message: "success",
      success: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("GoodShort AllEpisode (dramaletto) Error:", error);
    return encryptedResponse(
      { status: 500, message: "Failed to fetch episodes from GoodShort", data: null },
      500
    );
  }
}
