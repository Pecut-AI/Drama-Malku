/**
 * Lanjut Menonton (Continue Watching) — penyimpanan lokal (20 Okt 2026).
 *
 * Seluruh data hidup di localStorage perangkat: tanpa akun, tanpa request API.
 * - "dramamalku:continue-watching:v1": daftar tontonan terakhir (maks 12),
 *   satu entri per drama: episode terakhir + posisi detik terakhir.
 * - "dramamalku:drama-meta:v1": judul + poster per drama, diisi saat pengguna
 *   mengklik kartu drama (UnifiedMediaCard / hasil pencarian), karena halaman
 *   watch sendiri tidak selalu membawa judul & poster.
 *
 * Melanjutkan tontonan: rak beranda membuat token watch BARU lewat
 * createWatchToken (token lama memang hanya hidup 24 jam di sessionStorage)
 * lalu membuka URL watch sesuai pola platformnya.
 */

export interface ContinueWatchingEntry {
  platform: string;
  dramaId: string;
  title: string;
  cover?: string;
  episodeId?: string;
  episodeNumber?: number;
  episodeIndex?: number;
  positionSec: number;
  durationSec: number;
  updatedAt: number;
}

export interface DramaMeta {
  title: string;
  cover?: string;
}

const CW_KEY = "dramamalku:continue-watching:v1";
const META_KEY = "dramamalku:drama-meta:v1";
const MAX_ENTRIES = 12;
export const CW_UPDATED_EVENT = "dramamalku:cw-updated";

/** Platform yang token watch-nya ditaruh sebagai segmen URL terakhir. */
const SEGMENT_TOKEN_PLATFORMS = ["melolo", "pinedrama", "goodshort", "dramanova"];

function notifyUpdated() {
  try {
    window.dispatchEvent(new Event(CW_UPDATED_EVENT));
  } catch {
    // abaikan
  }
}

export function getContinueWatching(): ContinueWatchingEntry[] {
  try {
    const raw = localStorage.getItem(CW_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && e.platform && e.dramaId)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function saveEntries(entries: ContinueWatchingEntry[]) {
  try {
    localStorage.setItem(CW_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    notifyUpdated();
  } catch {
    // localStorage penuh/tidak tersedia — fitur ini opsional, diamkan
  }
}

/** Simpan/perbarui posisi tontonan satu drama (dipanggil perekam di halaman watch). */
export function upsertContinueWatching(
  entry: Omit<ContinueWatchingEntry, "title" | "updatedAt"> & { title?: string }
) {
  const meta = getDramaMeta(entry.platform, entry.dramaId);
  const entries = getContinueWatching().filter(
    (e) => !(e.platform === entry.platform && e.dramaId === entry.dramaId)
  );
  entries.unshift({
    ...entry,
    title: entry.title || meta?.title || entry.dramaId,
    cover: meta?.cover,
    updatedAt: Date.now(),
  });
  saveEntries(entries);
}

export function removeContinueWatching(platform: string, dramaId: string) {
  saveEntries(
    getContinueWatching().filter(
      (e) => !(e.platform === platform && e.dramaId === dramaId)
    )
  );
}

export function clearContinueWatching() {
  saveEntries([]);
}

export function stashDramaMeta(platform: string, dramaId: string, meta: DramaMeta) {
  if (!platform || !dramaId || !meta.title) return;
  try {
    const raw = localStorage.getItem(META_KEY);
    const map: Record<string, DramaMeta> = raw ? JSON.parse(raw) : {};
    map[`${platform}:${dramaId}`] = meta;
    // Batasi ukuran stash (simpan 200 drama terakhir yang diklik)
    const keys = Object.keys(map);
    if (keys.length > 200) {
      keys.slice(0, keys.length - 200).forEach((k) => delete map[k]);
    }
    localStorage.setItem(META_KEY, JSON.stringify(map));
  } catch {
    // abaikan
  }
}

export function getDramaMeta(platform: string, dramaId: string): DramaMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[`${platform}:${dramaId}`] || null;
  } catch {
    return null;
  }
}

/** Urai tautan detail "/detail/<platform>/<id>" menjadi platform + id drama. */
export function parseDetailLink(
  link: string
): { platform: string; dramaId: string } | null {
  const m = link.match(/^\/detail\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return { platform: m[1], dramaId: decodeURIComponent(m[2]) };
}

/** Bangun URL watch untuk melanjutkan tontonan, mengikuti pola tiap platform. */
export function buildResumeWatchUrl(
  platform: string,
  dramaId: string,
  token: string
): string {
  if (SEGMENT_TOKEN_PLATFORMS.includes(platform)) {
    return `/watch/${platform}/${dramaId}/${token}`;
  }
  return `/watch/${platform}/${dramaId}?t=${token}`;
}
