/**
 * Daftar Saya (Favorit) — penyimpanan lokal (23 Okt 2026).
 *
 * Pola sama seperti Lanjut Menonton: seluruh data hidup di localStorage
 * perangkat (tanpa akun, tanpa request API). Satu entri per drama,
 * diurutkan dari yang paling baru ditambahkan. Maks 200 entri.
 */

export interface FavoriteEntry {
  platform: string;
  dramaId: string;
  title: string;
  cover?: string;
  addedAt: number;
}

const FAV_KEY = "dramamalku:favorites:v1";
const MAX_FAVORITES = 200;
export const FAVORITES_UPDATED_EVENT = "dramamalku:favorites-updated";

function notifyUpdated() {
  try {
    window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
  } catch {
    // abaikan
  }
}

export function getFavorites(): FavoriteEntry[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && e.platform && e.dramaId && e.title)
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

function saveFavorites(entries: FavoriteEntry[]) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(entries.slice(0, MAX_FAVORITES)));
    notifyUpdated();
  } catch {
    // localStorage penuh/tidak tersedia — fitur opsional, diamkan
  }
}

export function isFavorite(platform: string, dramaId: string): boolean {
  return getFavorites().some((e) => e.platform === platform && e.dramaId === dramaId);
}

/** Tambah bila belum ada, hapus bila sudah ada. Mengembalikan status baru. */
export function toggleFavorite(entry: Omit<FavoriteEntry, "addedAt">): boolean {
  const current = getFavorites();
  const exists = current.some(
    (e) => e.platform === entry.platform && e.dramaId === entry.dramaId
  );
  if (exists) {
    saveFavorites(
      current.filter((e) => !(e.platform === entry.platform && e.dramaId === entry.dramaId))
    );
    return false;
  }
  saveFavorites([{ ...entry, addedAt: Date.now() }, ...current]);
  return true;
}

export function removeFavorite(platform: string, dramaId: string) {
  saveFavorites(
    getFavorites().filter((e) => !(e.platform === platform && e.dramaId === dramaId))
  );
}

export function clearFavorites() {
  saveFavorites([]);
}

/** URL halaman detail sebuah drama (pola /detail/<platform>/<id>). */
export function favoriteDetailHref(platform: string, dramaId: string): string {
  return `/detail/${platform}/${dramaId}`;
}
