// Proxy stream terpadu untuk semua platform dramaletto (netshort,
// goodshort, flickreels, shortmax, moboreels, dramawave, vibeshort).
// Server DramaMalku memegang sesi dramaletto + tiketnya; browser
// pengunjung hanya melihat URL DramaMalku.
//
// mode=video     -> MP4 (netshort, moboreels), meneruskan Range (206/seek)
// mode=playlist  -> playlist HLS yang segmennya sudah ditulis ulang
// mode=seg       -> satu segmen/playlist lanjutan bertiket dramaletto (?p=)
// mode=raw       -> segmen CDN langsung tanpa tiket (?url=, https saja)
// mode=subtitle  -> file subtitle (WEBVTT) bertiket
import { NextRequest } from "next/server";
import {
  DL_BASE,
  dlTicket,
  dlDropTicket,
  dlRewrittenPlaylist,
  dlRewritePlaylistText,
  type DlProvider,
} from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

const PROVIDERS: DlProvider[] = [
  "netshort",
  "goodshort",
  "flickreels",
  "shortmax",
  "moboreels",
  "dramawave",
  "vibeshort",
];

function parseProvider(v: string | null): DlProvider | null {
  return v && (PROVIDERS as string[]).includes(v) ? (v as DlProvider) : null;
}

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const provider = parseProvider(sp.get("provider"));
  const mode = sp.get("mode") || "video";
  const titleId = sp.get("titleId") || "";
  const ep = parseInt(sp.get("ep") || "0", 10);

  // --- segmen CDN langsung (tanpa tiket dramaletto) ---
  if (mode === "raw") {
    const url = sp.get("url") || "";
    if (!url.startsWith("https://")) return new Response("url tidak valid", { status: 400 });
    const up = await fetch(url, { cache: "no-store" });
    if (!up.ok) return new Response(`upstream ${up.status}`, { status: 502 });
    const headers = new Headers(up.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("cache-control", "public, max-age=3600");
    return new Response(up.body, { status: up.status, headers });
  }

  if (!provider || !titleId || !ep) {
    return new Response("provider, titleId, ep wajib", { status: 400 });
  }

  // --- playlist HLS (segmen ditulis ulang ke proxy ini) ---
  if (mode === "playlist") {
    const playlist = await dlRewrittenPlaylist(provider, titleId, ep);
    if (!playlist) return new Response("playlist tidak tersedia", { status: 502 });
    return new Response(playlist, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-cache",
        ...CORS,
      },
    });
  }

  // --- segmen / playlist lanjutan bertiket ---
  if (mode === "seg") {
    const p = sp.get("p") || "";
    if (!p.startsWith("/api/stream/")) return new Response("p tidak valid", { status: 400 });
    for (let attempt = 0; attempt < 2; attempt++) {
      const { cookie } = await dlTicket(provider, titleId, ep);
      const up = await fetch(`${DL_BASE}${p}`, {
        headers: { Cookie: cookie },
        cache: "no-store",
      });
      if ((up.status === 401 || up.status === 403) && attempt === 0) {
        // Sesi instance ini mungkin baru (serverless) — coba sesi berjalan.
        // Tiket di p adalah tiket lama; bila tetap ditolak, minta ulang
        // playlist dari awal adalah urusan pemutar (ia memuat ulang episode).
        continue;
      }
      if (!up.ok) return new Response(`upstream ${up.status}`, { status: 502 });
      const text = await up.clone().text().catch(() => "");
      if (text.includes("#EXTM3U")) {
        // playlist bersarang (mis. varian DramaWave) — tulis ulang teks
        // playlist INI (bukan playlist induk), relatif terhadap path-nya
        const rewritten = dlRewritePlaylistText(text, provider, titleId, ep, p);
        return new Response(rewritten, {
          status: 200,
          headers: { "Content-Type": "application/vnd.apple.mpegurl", ...CORS },
        });
      }
      const headers = new Headers(up.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("cache-control", "public, max-age=3600");
      return new Response(up.body, { status: up.status, headers });
    }
    return new Response("segmen ditolak upstream", { status: 502 });
  }

  // --- video MP4 / subtitle bertiket ---
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: ticket, cookie } = await dlTicket(provider, titleId, ep);
    let upstreamUrl: string;
    if (mode === "subtitle") {
      const index = sp.get("index") || "0";
      upstreamUrl = `${DL_BASE}/api/stream/subtitle?t=${ticket.ticket}&i=${index}`;
    } else {
      upstreamUrl = `${DL_BASE}${ticket.video}`;
    }
    const headers: Record<string, string> = { Cookie: cookie };
    const range = request.headers.get("range");
    if (range && mode === "video") headers["Range"] = range;

    const up = await fetch(upstreamUrl, { headers, cache: "no-store" });
    if ((up.status === 401 || up.status === 403) && attempt === 0) {
      dlDropTicket(provider, titleId, ep);
      continue;
    }
    if (!up.ok && up.status !== 206) {
      return new Response(`upstream ${up.status}`, { status: 502 });
    }
    // Khusus goodshort: /api/stream/video-nya berisi playlist HLS, bukan MP4.
    const ctype = up.headers.get("content-type") || "";
    if (mode === "video" && ctype.includes("mpegurl")) {
      const playlist = await dlRewrittenPlaylist(provider, titleId, ep);
      if (playlist) {
        return new Response(playlist, {
          status: 200,
          headers: { "Content-Type": "application/vnd.apple.mpegurl", ...CORS },
        });
      }
    }
    const out = new Headers();
    for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      const v = up.headers.get(h);
      if (v) out.set(h, v);
    }
    out.set("cache-control", "no-store");
    out.set("Access-Control-Allow-Origin", "*");
    if (mode === "subtitle") out.set("content-type", "text/vtt; charset=utf-8");
    return new Response(up.body, { status: up.status, headers: out });
  }
  return new Response("gagal mengambil stream", { status: 502 });
}
