"use client";

import { Play, X } from "lucide-react";

interface AutoNextOverlayProps {
  countdown: number | null;
  onPlayNow: () => void;
  onCancel: () => void;
}

/**
 * Kartu hitung mundur episode berikutnya — tampil melayang di atas pemutar
 * saat video berakhir dan masih ada episode lanjutan.
 */
export function AutoNextOverlay({ countdown, onPlayNow, onCancel }: AutoNextOverlayProps) {
  if (countdown === null) return null;

  return (
    <div className="absolute inset-x-0 bottom-32 md:bottom-28 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 md:gap-3 bg-black/80 backdrop-blur-md border border-white/15 rounded-full pl-4 pr-1.5 py-1.5 shadow-2xl">
        <span className="text-white text-xs md:text-sm whitespace-nowrap">
          Episode berikutnya dalam <span className="font-bold tabular-nums">{countdown}</span> dtk
        </span>
        <button
          onClick={onPlayNow}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Play className="w-3 h-3 fill-white" />
          Putar Sekarang
        </button>
        <button
          onClick={onCancel}
          aria-label="Batalkan putar otomatis"
          className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
