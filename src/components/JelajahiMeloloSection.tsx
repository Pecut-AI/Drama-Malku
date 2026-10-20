"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { fetchJson } from "@/lib/fetcher";
import {
  useMeloloTrending,
  useMeloloLatest,
  type MeloloBook,
  type MeloloSearchResponse,
} from "@/hooks/useMelolo";
import {
  getJelajahiCycleKeywords,
  getJelajahiCycleSlot,
} from "@/lib/jelajahi";

const PAGE_SIZE = 18;
const HARVEST_GAP_MS = 700;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Panen bertahap: kata kunci siklus ini diminta satu per satu dengan jeda,
 * bukan serentak, agar tidak menabrak batas request API. Kegagalan satu kata
 * kunci tidak menggagalkan sisanya (hasil parsial tetap dipakai).
 */
async function harvestKeywords(keywords: string[]): Promise<MeloloBook[][]> {
  const perKeyword: MeloloBook[][] = [];
  for (let i = 0; i < keywords.length; i++) {
    try {
      const res = await fetchJson<MeloloSearchResponse>(
        `/api/melolo/jelajahi?keyword=${encodeURIComponent(keywords[i])}`
      );
      const books =
        res?.data?.search_data?.flatMap((group) => group.books || []) || [];
      perKeyword.push(books);
    } catch {
      perKeyword.push([]);
    }
    if (i < keywords.length - 1) {
      await sleep(HARVEST_GAP_MS);
    }
  }
  return perKeyword;
}

/** Gabung hasil antar kata kunci secara selang-seling (round-robin) lalu dedup per book_id, urutan stabil. */
function mergeInterleaved(perKeyword: MeloloBook[][]): MeloloBook[] {
  const seen = new Set<string>();
  const merged: MeloloBook[] = [];
  const maxLen = Math.max(0, ...perKeyword.map((list) => list.length));
  for (let idx = 0; idx < maxLen; idx++) {
    for (const list of perKeyword) {
      const book = list[idx];
      if (!book?.book_id || seen.has(book.book_id)) continue;
      seen.add(book.book_id);
      merged.push(book);
    }
  }
  return merged;
}

export function JelajahiMeloloSection() {
  const slot = getJelajahiCycleSlot();
  const keywords = useMemo(() => getJelajahiCycleKeywords(), []);

  const { data: perKeyword, isLoading } = useQuery({
    queryKey: ["melolo", "jelajahi", slot, keywords.join(",")],
    queryFn: () => harvestKeywords(keywords),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
  });

  // Data seksi lain dipakai untuk dedup lintas seksi. Hook-hook ini berbagi
  // cache React Query dengan seksi aslinya, jadi tidak ada request tambahan.
  // (Seksi "Lainnya" sudah dihapus — perannya digantikan seksi ini.)
  const { data: trendingData } = useMeloloTrending();
  const { data: latestData } = useMeloloLatest();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const books = useMemo(() => {
    if (!perKeyword) return [];
    const excluded = new Set<string>();
    trendingData?.books?.forEach((b) => b?.book_id && excluded.add(b.book_id));
    latestData?.books?.forEach((b) => b?.book_id && excluded.add(b.book_id));
    return mergeInterleaved(perKeyword).filter((b) => !excluded.has(b.book_id));
  }, [perKeyword, trendingData, latestData]);

  // Gulir tanpa batas (penyeragaman pola muat daftar, permintaan Elnath):
  // sentinel di bawah grid — saat mendekati viewport, irisan berikutnya dari
  // pool yang SUDAH dipanen ditampilkan. Tetap nol request tambahan.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(false);
  hasMoreRef.current = visibleCount < books.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [books.length]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <UnifiedMediaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // Panen gagal total atau semua judul sudah tampil di seksi lain: sembunyikan seksi.
  if (books.length === 0) return null;

  const visible = books.slice(0, visibleCount);
  const hasMore = visibleCount < books.length;

  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
            Jelajahi
          </h2>
          <span className="text-xs md:text-sm text-muted-foreground">
            {books.length} judul
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Pilihan judul lain dari pencarian untukmu
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {visible.map((book, index) => (
          <UnifiedMediaCard
            key={book.book_id}
            index={index}
            title={book.book_name}
            cover={book.thumb_url}
            link={`/detail/melolo/${book.book_id}`}
            episodes={book.serial_count || 0}
            meta={book.stat_infos?.[0] || undefined}
            topLeftBadge={null}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="py-8 flex justify-center w-full">
        {hasMore ? (
          <span className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat lebih banyak…
          </span>
        ) : (
          <p className="text-muted-foreground text-sm">
            Itu semua untuk saat ini — daftar diperbarui berkala
          </p>
        )}
      </div>
    </section>
  );
}
