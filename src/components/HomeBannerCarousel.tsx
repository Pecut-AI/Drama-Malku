"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { optimizeCover } from "@/lib/image-utils";

export interface BannerItem {
  id: string;
  title: string;
  cover: string;
  href: string;
  /** Gambar poster potret bila berbeda dari cover (mis. banner lebar ReelShort). */
  poster?: string;
  meta?: string;
  description?: string;
}

interface HomeBannerCarouselProps {
  items: BannerItem[];
  /** Nama platform untuk label kecil di banner. */
  platformName?: string;
  autoPlayMs?: number;
}

/**
 * Banner carousel standar semua platform (20 Okt 2026, permintaan Elnath):
 * - Ukuran sinematik tetap: 270px (HP) / 330px (sm) / 390px (lg), sudut
 *   membulat besar — BUKAN ukuran pita tipis 3:1 milik carousel ReelShort lama.
 * - Bisa digeser horizontal secara manual (geser sentuh / seret / tombol
 *   panah / titik indikator) DAN otomatis bergeser tiap ±5,5 detik; putaran
 *   otomatis berhenti saat pengguna berinteraksi dan lanjut lagi setelahnya.
 * - Latar memakai poster yang diburamkan memenuhi bingkai + poster tajam di
 *   kiri, jadi tetap bagus walau sumber gambarnya potret (mayoritas API).
 */
export function HomeBannerCarousel({
  items,
  platformName,
  autoPlayMs = 5500,
}: HomeBannerCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = items.length;

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = ((index % count) + count) % count;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }, [count]);

  // Putar otomatis
  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => {
      const track = trackRef.current;
      if (!track || document.visibilityState !== "visible") return;
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      scrollToIndex(idx + 1);
    }, autoPlayMs);
    return () => clearInterval(t);
  }, [count, paused, autoPlayMs, scrollToIndex]);

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
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
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
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={item.id} className="relative min-w-full h-full snap-center">
            {/* Latar: poster diburamkan memenuhi bingkai */}
            <Image
              src={optimizeCover(item.cover)}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover blur-lg scale-125 opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/20" />

            {/* Seluruh slide menuju detail */}
            <Link href={item.href} className="absolute inset-0 z-10" aria-label={item.title} />

            {/* Konten */}
            <div className="absolute inset-0 z-20 flex items-center gap-4 sm:gap-6 p-5 sm:p-8 pointer-events-none">
              <div className="relative w-[76px] min-[400px]:w-24 sm:w-32 lg:w-36 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shrink-0">
                <Image
                  src={optimizeCover(item.poster || item.cover)}
                  alt={item.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 max-w-xl">
                {(platformName || item.meta) && (
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    {platformName && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-gradient-to-r from-primary to-secondary text-white">
                        {platformName}
                      </span>
                    )}
                    {item.meta && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-white/15 text-white backdrop-blur-sm">
                        {item.meta}
                      </span>
                    )}
                  </div>
                )}
                <h3 className="font-display font-bold text-white text-lg sm:text-3xl lg:text-4xl leading-tight line-clamp-2 drop-shadow">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs sm:text-sm text-white/75 line-clamp-3 sm:line-clamp-2 mt-2 sm:mt-3">
                    {item.description}
                  </p>
                )}
                <span className="hidden sm:inline-flex items-center gap-2 mt-3 sm:mt-5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary text-white text-xs sm:text-sm font-semibold shadow-lg">
                  <Play className="w-4 h-4 fill-white" />
                  Tonton Sekarang
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Panah navigasi */}
      {count > 1 && (
        <>
          <button
            onClick={() => {
              pauseTemporarily();
              scrollToIndex(active - 1);
            }}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm items-center justify-center text-white opacity-0 group-hover/banner:opacity-100 hover:bg-black/65 transition"
            aria-label="Banner sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              pauseTemporarily();
              scrollToIndex(active + 1);
            }}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm items-center justify-center text-white opacity-0 group-hover/banner:opacity-100 hover:bg-black/65 transition"
            aria-label="Banner berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indikator titik */}
          <div className="absolute bottom-4 right-5 z-30 flex items-center gap-1.5">
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
