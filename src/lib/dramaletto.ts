/**
 * Klien server-side untuk API publik dramaletto.com — dipakai sebagai
 * upstream DramaMalku untuk platform: netshort, goodshort, flickreels,
 * shortmax (perintah Elnath, 23 Okt 2026; menggantikan api.sansekai.my.id
 * untuk keempat platform itu).
 *
 * Alurnya meniru persis browser pengunjung dramaletto sendiri:
 *  1. POST /api/session/bootstrap {}  -> cookie sesi anonim (HttpOnly)
 *  2. GET  /api/providers/<provider>/... dengan cookie itu
 *  3. POST /api/stream/ticket         -> tiket stream terikat sesi yang sama
 *  4. GET  /api/stream/video|hls|subtitle dengan cookie pembuat tiket
 *
 * Tidak ada kunci/akun/bypass — semua endpoint terbuka untuk pengunjung.
 *
 * Catatan desain penting:
 * - Sesi SENGAJA dipertahankan lama (12 jam) dan hanya di-bootstrap ulang
 *   bila dramaletto menolaknya (401). Tiket stream terikat ke sesi
 *   pembuatnya (sesi lain = 403), jadi mengganti sesi di tengah jalan
 *   akan mematikan tiket yang sedang dipakai penonton.
 * - Di serverless (Vercel) cache sesi/tiket ini per-instance dan bisa
 *   reset kapan saja; semua pemanggil wajib tahan terhadap 401/403
 *   dengan meminta tiket baru (sudah ditangani di lapisan proxy).
 */

export const DL_BASE = "https://dramaletto.com";
export const DL_LANG = "in"; // kode bahasa Indonesia di dramaletto = "in" (bukan "id")
export type DlProvider = "netshort" | "goodshort" | "flickreels" | "shortmax";

// ---------------------------------------------------------------- sesi
let sessionCookie: string | null = null;
let sessionAt = 0;
const SESSION_MAX_AGE = 12 * 60 * 60 * 1000;

async function bootstrap(): Promise<string> {
  const res = await fetch(`${DL_BASE}/api/session/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`dramaletto bootstrap gagal: ${res.status}`);
  const setCookies =
    typeof (res.headers as any).getSetCookie === "function"
      ? (res.headers as any).getSetCookie()
      : [res.headers.get("set-cookie") || ""];
  const cookie = setCookies
    .map((c: string) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
  if (!cookie) throw new Error("dramaletto bootstrap tidak memberi cookie sesi");
  sessionCookie = cookie;
  sessionAt = Date.now();
  return cookie;
}

export async function dlSession(force = false): Promise<string> {
  if (!force && sessionCookie && Date.now() - sessionAt < SESSION_MAX_AGE) {
    return sessionCookie;
  }
  return bootstrap();
}

// ---------------------------------------------------------------- fetch umum
export async function dlFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookie = await dlSession();
  let res = await fetch(`${DL_BASE}${path}`, {
    ...init,
    headers: { ...(init?.headers || {}), Cookie: cookie },
    cache: "no-store",
  });
  if (res.status === 401) {
    const fresh = await dlSession(true);
    res = await fetch(`${DL_BASE}${path}`, {
      ...init,
      headers: { ...(init?.headers || {}), Cookie: fresh },
      cache: "no-store",
    });
  }
  return res;
}

export async function dlJson<T>(path: string): Promise<T> {
  const res = await dlFetch(path);
  if (!res.ok) throw new Error(`dramaletto ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

// ---------------------------------------------------------------- endpoint katalog per provider
export const dlHome = (p: DlProvider) =>
  dlJson<DlSection[]>(`/api/providers/${p}/home?lang=${DL_LANG}`);
export const dlBrowse = (p: DlProvider, page: number | string) =>
  dlJson<DlItem[]>(`/api/providers/${p}/browse?lang=${DL_LANG}&page=${page}`);
export const dlSearch = (p: DlProvider, q: string, page = 1) =>
  dlJson<DlItem[]>(
    `/api/providers/${p}/search?lang=${DL_LANG}&q=${encodeURIComponent(q)}&page=${page}`
  );
export const dlTitle = (p: DlProvider, id: string) =>
  dlJson<DlTitle>(`/api/providers/${p}/title/${encodeURIComponent(id)}?lang=${DL_LANG}`);

// ---------------------------------------------------------------- bentuk data dramaletto
export interface DlItem {
  id: string;
  provider: string;
  title: string;
  cover: string;
  poster: string;
  totalEpisodes: number;
  tags: string[];
  heat: number | null;
}

export interface DlSection {
  id: string;
  title: string;
  style: string;
  items: DlItem[];
}

export interface DlTitle {
  id: string;
  provider: string;
  title: string;
  cover: string;
  totalEpisodes: number;
  tags: string[];
  synopsis: string;
  finished?: boolean | null;
  episodes: {
    episodeNo: number;
    episodeId: string;
    cover: string;
    duration?: number | null;
    isLocked: boolean;
  }[];
}

export interface DlTicket {
  ticket: string;
  video: string;
  videoDirect: string;
  type: string; // "mp4" (netshort; goodshort isinya ternyata playlist HLS) | "hls"
  clarity: string;
  subtitles: { lang: string; label: string; index: number; url: string }[];
}

// ---------------------------------------------------------------- tiket (terikat sesi!)
export interface CachedTicket {
  data: DlTicket;
  cookie: string; // WAJIB cookie sesi yang sama dengan saat tiket dibuat
  at: number;
}
const ticketCache = new Map<string, CachedTicket>();
const TICKET_MAX_AGE = 2 * 60 * 60 * 1000;

const ticketKey = (p: DlProvider, titleId: string, episodeNo: number) =>
  `${p}:${titleId}:${episodeNo}:${DL_LANG}`;

export async function dlTicket(
  provider: DlProvider,
  titleId: string,
  episodeNo: number
): Promise<CachedTicket> {
  const key = ticketKey(provider, titleId, episodeNo);
  const hit = ticketCache.get(key);
  if (hit && Date.now() - hit.at < TICKET_MAX_AGE) return hit;

  const doMint = async (ck: string) =>
    fetch(`${DL_BASE}/api/stream/ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ck },
      body: JSON.stringify({ provider, titleId, episodeNo, lang: DL_LANG }),
      cache: "no-store",
    });

  let usedCookie = await dlSession();
  let res = await doMint(usedCookie);
  if (res.status === 401) {
    usedCookie = await dlSession(true);
    res = await doMint(usedCookie);
  }
  if (!res.ok) throw new Error(`dramaletto ticket -> ${res.status}`);
  const data = (await res.json()) as DlTicket;
  const entry = { data, cookie: usedCookie, at: Date.now() };
  ticketCache.set(key, entry);
  return entry;
}

export function dlDropTicket(provider: DlProvider, titleId: string, episodeNo: number) {
  ticketCache.delete(ticketKey(provider, titleId, episodeNo));
}

/** URL proxy stream milik DramaMalku sendiri untuk satu episode. */
export function dlProxyUrl(
  provider: DlProvider,
  mode: "video" | "playlist" | "subtitle",
  titleId: string,
  episodeNo: number,
  extra = ""
): string {
  return (
    `/api/dramaletto/proxy?provider=${provider}&mode=${mode}` +
    `&titleId=${encodeURIComponent(titleId)}&ep=${episodeNo}${extra}`
  );
}

/**
 * Ambil playlist HLS sebuah episode dari dramaletto dan tulis ulang
 * baris-baris segmennya agar lewat proxy DramaMalku:
 * - baris "/api/stream/..." (segmen bertiket dramaletto) -> mode=seg
 * - baris "https://..." (segmen CDN langsung)             -> mode=raw
 * - baris relatif                                          -> mode=seg (diselesaikan ke path dramaletto)
 * Mengembalikan null bila respons upstream bukan playlist.
 */
export async function dlRewrittenPlaylist(
  provider: DlProvider,
  titleId: string,
  episodeNo: number
): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: ticket, cookie } = await dlTicket(provider, titleId, episodeNo);
    const res = await fetch(`${DL_BASE}${ticket.video}`, {
      headers: { Cookie: cookie },
      cache: "no-store",
    });
    if ((res.status === 401 || res.status === 403) && attempt === 0) {
      dlDropTicket(provider, titleId, episodeNo);
      continue;
    }
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("#EXTM3U")) return null;

    const segBase = `/api/dramaletto/proxy?provider=${provider}&titleId=${encodeURIComponent(titleId)}&ep=${episodeNo}`;
    const rawUrl = (u: string) => `/api/dramaletto/proxy?mode=raw&url=${encodeURIComponent(u)}`;
    // Baris segmen dramaletto berbentuk /api/stream/hls?t=..&u=<base64 URL
    // segmen CDN asli>&s=<tanda tangan>. URL di dalam "u" itu segmen CDN
    // publik (terverifikasi bisa diambil tanpa autentikasi apa pun), jadi
    // segmen media diarahkan ke URL aslinya lewat mode=raw — ini sekaligus
    // kebal masalah sesi beda instance di serverless. Hanya playlist
    // bersarang yang tetap lewat mode=seg (butuh sesi+tiket).
    const rewriteDlPath = (p: string): string => {
      try {
        const qs = new URLSearchParams(p.split("?")[1] || "");
        const u = qs.get("u");
        if (u) {
          const decoded = Buffer.from(u, "base64").toString("utf8");
          if (/^https:\/\//.test(decoded) && !decoded.includes(".m3u8")) {
            return rawUrl(decoded);
          }
        }
      } catch {
        /* abaikan, pakai seg */
      }
      return `${segBase}&mode=seg&p=${encodeURIComponent(p)}`;
    };
    const lines = text.split("\n").map((line) => {
      const l = line.trim();
      if (!l || l.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          if (uri.startsWith("/api/stream/")) return `URI="${rewriteDlPath(uri)}"`;
          if (uri.startsWith("http")) return `URI="${rawUrl(uri)}"`;
          return _m;
        });
      }
      if (l.startsWith("/api/stream/")) {
        return rewriteDlPath(l);
      }
      if (l.startsWith("http://") || l.startsWith("https://")) {
        return rawUrl(l);
      }
      // baris relatif: selesaikan terhadap URL playlist dramaletto
      try {
        const abs = new URL(l, `${DL_BASE}${ticket.video}`);
        const p = abs.pathname + abs.search;
        if (p.startsWith("/api/stream/")) {
          return rewriteDlPath(p);
        }
        return rawUrl(abs.href);
      } catch {
        return line;
      }
    });
    return lines.join("\n");
  }
  return null;
}
