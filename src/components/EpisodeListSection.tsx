"use client";

// Daftar episode di halaman detail — meniru dramaletto: setelah judul
// diklik, pengguna melihat grid nomor episode dan bisa langsung lompat
// ke episode mana pun (bukan hanya mulai dari episode 1).
// Dipakai bersama oleh semua platform; tiap halaman detail menyediakan
// daftar item + handler navigasinya sendiri (pola token tiap platform
// berbeda-beda).
import { Lock } from "lucide-react";

export interface EpisodeListItem {
  /** Nomor episode yang ditampilkan (1-based). */
  no: number;
  /** Nilai bawaan platform (mis. vid Melolo) — diteruskan kembali ke handler. */
  value?: string | number;
  locked?: boolean;
}

export function episodesFromCount(total: number): EpisodeListItem[] {
  const n = Math.max(0, Math.floor(total || 0));
  return Array.from({ length: n }, (_, i) => ({ no: i + 1 }));
}

interface Props {
  items: EpisodeListItem[];
  onSelect: (item: EpisodeListItem) => void;
}

export function EpisodeListSection({ items, onSelect }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <section className="relative max-w-7xl mx-auto px-4 pb-14">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold font-display text-foreground">
          Daftar Episode
        </h2>
        <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
          Total {items.length}
        </span>
      </div>
      <div className="glass rounded-2xl p-3 sm:p-4 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {items.map((item) => (
            <button
              key={item.no}
              onClick={() => onSelect(item)}
              className="relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium bg-muted/40 text-foreground/80 hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label={`Tonton episode ${item.no}`}
            >
              {item.no}
              {item.locked && (
                <Lock className="w-3 h-3 absolute top-1 right-1 opacity-60" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
