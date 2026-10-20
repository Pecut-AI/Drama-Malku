"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Play, X, Trash2 } from "lucide-react";
import { createWatchToken } from "@/lib/watch-session";
import { PLATFORMS } from "@/hooks/usePlatform";
import { optimizeCover } from "@/lib/image-utils";
import {
  CW_UPDATED_EVENT,
  buildResumeWatchUrl,
  clearContinueWatching,
  getContinueWatching,
  removeContinueWatching,
  type ContinueWatchingEntry,
} from "@/lib/continue-watching";

function platformName(platform: string): string {
  return PLATFORMS.find((p) => p.id === platform)?.name || platform;
}

function episodeLabel(entry: ContinueWatchingEntry): string | null {
  if (entry.episodeNumber != null) return `Episode ${entry.episodeNumber}`;
  if (entry.episodeIndex != null) return `Episode ${entry.episodeIndex + 1}`;
  return null;
}

function remainingLabel(entry: ContinueWatchingEntry): string | null {
  const dur = entry.durationSec || 0;
  const pos = entry.positionSec || 0;
  if (dur <= 0) return null;
  if (pos / dur >= 0.97) return "Selesai";
  const sisa = Math.max(0, Math.round((dur - pos) / 60));
  return sisa > 0 ? `Sisa ${sisa} mnt` : "Hampir selesai";
}

/**
 * Rak "Lanjut Menonton" di beranda — tampil hanya bila ada riwayat lokal.
 * Klik kartu: buat token watch baru untuk episode tersimpan dan buka
 * pemutarnya; perekam di halaman watch akan melompat ke posisi terakhir.
 */
export function ContinueWatchingShelf() {
  const router = useRouter();
  const [entries, setEntries] = useState<ContinueWatchingEntry[]>([]);

  const refresh = useCallback(() => {
    setEntries(getContinueWatching());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(CW_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CW_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  if (entries.length === 0) return null;

  const handleResume = (entry: ContinueWatchingEntry) => {
    const token = createWatchToken({
      platform: entry.platform,
      bookId: entry.dramaId,
      episodeId: entry.episodeId,
      episodeNumber: entry.episodeNumber,
      episodeIndex: entry.episodeIndex,
    });
    router.push(buildResumeWatchUrl(entry.platform, entry.dramaId, token));
  };

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
          Lanjut Menonton
        </h2>
        <button
          onClick={() => clearContinueWatching()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus semua
        </button>
      </div>

      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4">
        {entries.map((entry) => {
          const progress =
            entry.durationSec > 0
              ? Math.min(100, Math.max(0, (entry.positionSec / entry.durationSec) * 100))
              : 0;
          const meta = [
            platformName(entry.platform),
            episodeLabel(entry),
            remainingLabel(entry),
          ]
            .filter(Boolean)
            .join(" • ");
          return (
            <div
              key={`${entry.platform}:${entry.dramaId}`}
              className="group relative w-[128px] sm:w-[148px] shrink-0 snap-start"
            >
              <button
                onClick={() => handleResume(entry)}
                className="block w-full text-left"
                title={`Lanjutkan ${entry.title}`}
              >
                <div className="aspect-[2/3] relative overflow-hidden rounded-xl bg-muted/20">
                  {entry.cover ? (
                    <Image
                      src={optimizeCover(entry.cover)}
                      alt={entry.title}
                      fill
                      sizes="160px"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/40 p-2">
                      <span className="text-[10px] text-muted-foreground text-center line-clamp-3">
                        {entry.title}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg opacity-90 group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* Progress bar posisi terakhir */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/25">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="font-display font-semibold text-xs leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {entry.title}
                  </h3>
                  {meta && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {meta}
                    </p>
                  )}
                </div>
              </button>
              <button
                onClick={() => removeContinueWatching(entry.platform, entry.dramaId)}
                className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-destructive/80 transition-colors"
                title="Hapus dari Lanjut Menonton"
                aria-label={`Hapus ${entry.title} dari Lanjut Menonton`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
