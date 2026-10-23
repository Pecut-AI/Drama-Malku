"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, X } from "lucide-react";
import { UnifiedMediaCard } from "@/components/UnifiedMediaCard";
import { PLATFORMS } from "@/hooks/usePlatform";
import {
  FAVORITES_UPDATED_EVENT,
  clearFavorites,
  favoriteDetailHref,
  getFavorites,
  removeFavorite,
  type FavoriteEntry,
} from "@/lib/favorites";

function platformName(slug: string): string {
  return PLATFORMS.find((p) => p.id === slug)?.name || slug;
}

export default function DaftarSayaPage() {
  const [items, setItems] = useState<FavoriteEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(getFavorites());
      setReady(true);
    };
    sync();
    window.addEventListener(FAVORITES_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Bookmark className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl font-bold">Daftar Saya</h1>
          {items.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {items.length} judul
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => clearFavorites()}
            className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Hapus semua
          </button>
        )}
      </div>

      {ready && items.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
          <Bookmark className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground max-w-sm">
            Belum ada drama di Daftar Saya. Ketuk ikon hati pada poster drama,
            atau tombol Daftar Saya di halaman detail, untuk menyimpannya di sini.
          </p>
          <Link
            href="/"
            className="mt-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
          >
            Jelajahi Drama
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {items.map((item) => (
            <div key={`${item.platform}:${item.dramaId}`} className="relative">
              <UnifiedMediaCard
                title={item.title}
                cover={item.cover || ""}
                link={favoriteDetailHref(item.platform, item.dramaId)}
                meta={platformName(item.platform)}
              />
              <button
                type="button"
                aria-label={`Hapus ${item.title} dari Daftar Saya`}
                onClick={() => removeFavorite(item.platform, item.dramaId)}
                className="absolute -top-1.5 -left-1.5 z-30 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
