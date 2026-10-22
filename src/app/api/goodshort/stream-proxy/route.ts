// Stream proxy GoodShort versi dramaletto (sejak 23 Okt 2026).
// Parameter ?url= berisi penanda "dramaletto:<bookId>:<episodeNo>" dari
// /api/goodshort/allepisode. Episode GoodShort di dramaletto ternyata
// berupa playlist HLS — dikembalikan apa adanya setelah segmennya
// ditulis ulang lewat proxy DramaMalku (/api/dramaletto/proxy).
import { NextRequest, NextResponse } from "next/server";
import { dlRewrittenPlaylist } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return new NextResponse("url parameter is required", { status: 400 });
    }
    const m = /^dramaletto:([^:]+):(\d+)$/.exec(url);
    if (!m) {
      return new NextResponse("format url tidak dikenal", { status: 400 });
    }
    const playlist = await dlRewrittenPlaylist("goodshort", m[1], parseInt(m[2], 10));
    if (!playlist) {
      return new NextResponse("playlist tidak tersedia", { status: 502 });
    }
    return new NextResponse(playlist, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("GoodShort stream proxy (dramaletto) error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
