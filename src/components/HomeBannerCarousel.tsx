"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { optimizeCover } from "@/lib/image-utils";
import { fetchJson } from "@/lib/fetcher";

export interface BannerItem {
  id: string;
  title: string;
  cover: string;
  href: string;
  /** Gambar poster potret bila berbeda dari cover (mis. banner lebar ReelShort). */
  poster?: string;
  meta?: string;
  description?: string;
  tags?: string[];
}

interface HomeBannerCarouselProps {
  items: BannerItem[];
  /** Nama platform untuk label kecil di banner. */
  platformName?: string;
  /** Id platform — mengaktifkan pengayaan sinopsis dari data detail untuk
   *  platform yang daftar berandanya tidak membawa sinopsis. */
  platform?: string;
  autoPlayMs?: number;
}

/**
 * Route detail per platform untuk pengayaan sinopsis banner. Semua route
 * detail bercache server 300 detik (evolusi P1), jadi biaya upstream-nya
 * terbatas walau diminta tiap kunjungan beranda. Hanya dipakai bila item
 * belum punya description.
 */
const SYNOPSIS_DETAIL_URL: Record<string, (id: string) => string> = {
  shortmax: (id) => `/api/shortmax/detail?shortPlayId=${encodeURIComponent(id)}`,
  netshort: (id) => `/api/netshort/detail?shortPlayId=${encodeURIComponent(id)}`,
  flickreels: (id) => `/api/flickreels/detail?playletId=${encodeURIComponent(id)}`,
  reelshort: (id) => `/api/reelshort/detail?bookId=${encodeURIComponent(id)}`,
};

function useEnrichedItems(
  platform: string | undefined,
  items: BannerItem[]
): BannerItem[] {
  const missingIdx = useMemo(
    () =>
      items
        .map((item, i) => (!item.description && platform && SYNOPSIS_DETAIL_URL[platform] ? i : -1))
        .filter((i) => i >= 0),
    [items, platform]
  );

  const results = useQueries({
    queries: missingIdx.map((i) => ({
      queryKey: ["banner-synopsis", platform, items[i].id],
      queryFn: () => fetchJson<any>(SYNOPSIS_DETAIL_URL[platform!](items[i].id)),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  return useMemo(() => {
    if (missingIdx.length === 0) return items;
    const copy = [...items];
    missingIdx.forEach((itemIdx, qIdx) => {
      const data: any = results[qIdx]?.data;
      const desc = data?.description || data?.data?.description;
      if (typeof desc === "string" && desc.trim()) {
        copy[itemIdx] = { ...copy[itemIdx], description: desc };
      }
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, missingIdx, results.map((r) => (r.data ? 1 : 0)).join("")]);
}

/**
 * Banner carousel standar semua platform — gaya gambar penuh (mengikuti
 * referensi yang diberikan Elnath 20 Okt 2026):
 * - Gambar drama memenuhi seluruh bingkai (bukan lagi poster kecil + latar
 *   buram); teks menimpa di kiri bawah: chip platform + episode, judul besar,
 *   chip tag, sinopsis 2 baris.
 * - Slide mengintip di tepi (peek) pada layar kecil; panah bulat gelap selalu
 *   terlihat di tepi; titik indikator di bawah tengah, aktif memanjang.
 * - Geser manual (sentuh/seret/panah/titik) + otomatis tiap ±5,5 detik; jeda
 *   saat interaksi, lanjut 8 detik setelahnya.
 * - Ukuran tetap 270px (HP) / 330px (sm) / 390px (lg), sudut membulat besar.
 */
export function HomeBannerCarousel({
  items: rawItems,
  platformName,
  platform,
  autoPlayMs = 5500,
}: HomeBannerCarouselProps) {
  const items = useEnrichedItems(platform, rawItems);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = items.length;

  // Lebar satu langkah geser = jarak antar awal slide (robust untuk semua
  // ukuran layar: HP tanpa celah, layar lebih besar dengan peek + celah 12px)
  const stepWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const a = track.children[0] as HTMLElement | undefined;
    const b = track.children[1] as HTMLElement | undefined;
    if (a && b) return b.offsetLeft - a.offsetLeft;
    return a ? a.offsetWidth : track.clientWidth;
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = ((index % count) + count) % count;
      track.scrollTo({ left: clamped * stepWidth(), behavior: "smooth" });
    },
    [count, stepWidth]
  );

  // Putar otomatis
  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => {
      const track = trackRef.current;
      if (!track || document.visibilityState !== "visible") return;
      const step = stepWidth();
      if (!step) return;
      const idx = Math.round(track.scrollLeft / step);
      scrollToIndex(idx + 1);
    }, autoPlayMs);
    return () => clearInterval(t);
  }, [count, paused, autoPlayMs, scrollToIndex, stepWidth]);

  const pauseTemporarily = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 8000);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const step = stepWidth();
    if (!step) return;
    setActive(Math.round(track.scrollLeft / step));
  };

  if (count === 0) return null;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden bg-muted/20 h-[270px] sm:h-[330px] lg:h-[390px] group/banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onPointerDown={pauseTemporarily}
        onWheel={pauseTemporarily}
        className="flex gap-0 sm:gap-3 h-full overflow-x-auto snap-x snap-mandatory scroll-smooth px-0 sm:px-[7%] lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            className="relative min-w-full sm:min-w-[86%] lg:min-w-full h-full snap-center rounded-none sm:rounded-2xl overflow-hidden"
          >
            {/* Gambar penuh memenuhi bingkai */}
            <Image
              src={optimizeCover(item.cover)}
              alt={item.title}
              fill
              sizes="(max-width: 1024px) 86vw, 100vw"
              priority={i === 0}
              className="object-cover object-[center_22%]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />

            {/* Seluruh slide menuju detail */}
            <Link href={item.href} className="absolute inset-0 z-10" aria-label={item.title} />

            {/* Konten menimpa di kiri bawah */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6 pb-9 sm:pb-10 pointer-events-none">
              <div className="max-w-xl">
                {(platformName || item.meta) && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                    {platformName && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-gradient-to-r from-primary to-secondary text-white shadow">
                        {platformName}
                      </span>
                    )}
                    {item.meta && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold bg-black/50 text-white backdrop-blur-sm border border-white/15">
                        {item.meta}
                      </span>
                    )}
                  </div>
                )}
                <h3 className="font-display font-extrabold text-white text-xl sm:text-3xl lg:text-4xl leading-tight line-clamp-2 drop-shadow-lg">
                  {item.title}
                </h3>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs text-white/90 bg-white/15 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {item.description && (
                  <p className="text-xs sm:text-sm text-white/85 line-clamp-2 mt-2 drop-shadow">
                    {item.description}
                  </p>
                )}
                <span className="hidden lg:inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-lg">
                  <Play className="w-4 h-4 fill-white" />
                  Tonton Sekarang
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Panah navigasi — selalu terlihat, bulat gelap di tepi */}
      {count > 1 && (
        <>
          <button
            onClick={() => {
              pauseTemporarily();
              scrollToIndex(active - 1);
            }}
            className="hidden sm:flex absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 items-center justify-center text-white hover:bg-black/65 transition"
            aria-label="Banner sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              pauseTemporarily();
              scrollToIndex(active + 1);
            }}
            className="hidden sm:flex absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 items-center justify-center text-white hover:bg-black/65 transition"
            aria-label="Banner berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indikator titik — bawah tengah, aktif memanjang */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => {
                  pauseTemporarily();
                  scrollToIndex(i);
                }}
                aria-label={`Ke banner ${i + 1}: ${item.title}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-6 bg-gradient-to-r from-primary to-secondary"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
