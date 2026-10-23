"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Heart } from "lucide-react";
import {
  FAVORITES_UPDATED_EVENT,
  isFavorite,
  toggleFavorite,
} from "@/lib/favorites";

function useFavoriteState(platform: string, dramaId: string) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const sync = () => setFav(isFavorite(platform, dramaId));
    sync();
    window.addEventListener(FAVORITES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [platform, dramaId]);

  return fav;
}

interface FavProps {
  platform: string;
  dramaId: string;
  title: string;
  cover?: string;
}

/** Tombol hati kecil untuk pojok kartu drama. */
export function FavoriteHeartButton({ platform, dramaId, title, cover }: FavProps) {
  const fav = useFavoriteState(platform, dramaId);
  return (
    <button
      type="button"
      aria-label={fav ? "Hapus dari Daftar Saya" : "Simpan ke Daftar Saya"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite({ platform, dramaId, title, cover });
      }}
      className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-90 transition-transform"
    >
      <Heart
        className={`w-3.5 h-3.5 md:w-4 md:h-4 ${fav ? "fill-rose-500 text-rose-500" : "text-white"}`}
      />
    </button>
  );
}

/**
 * Tombol untuk halaman detail. Varian "hero" menyamai ukuran tombol
 * "Mulai Menonton" (px-8 py-3, ikon 5) dan ditaruh tepat di bawahnya.
 */
export function FavoriteToggleButton({
  platform,
  dramaId,
  title,
  cover,
  variant = "default",
}: FavProps & { variant?: "default" | "hero" }) {
  const fav = useFavoriteState(platform, dramaId);
  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={() => toggleFavorite({ platform, dramaId, title, cover })}
        className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-lg ${
          fav
            ? "text-primary-foreground"
            : "bg-white/10 hover:bg-white/20 text-white border border-white/25"
        }`}
        style={fav ? { background: "var(--gradient-primary)" } : undefined}
      >
        {fav ? (
          <BookmarkCheck className="w-5 h-5" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
        {fav ? "Di Daftar Saya" : "Daftar Saya"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => toggleFavorite({ platform, dramaId, title, cover })}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
        fav
          ? "bg-primary text-primary-foreground"
          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
      }`}
    >
      {fav ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {fav ? "Di Daftar Saya" : "Daftar Saya"}
    </button>
  );
}
