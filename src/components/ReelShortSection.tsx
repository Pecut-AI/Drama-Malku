"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Play, Flame } from "lucide-react";
import { useReelShortHomepage } from "@/hooks/useReelShort";
import { HomeBannerCarousel } from "./HomeBannerCarousel";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { InfiniteReelShortSection } from "./InfiniteReelShortSection";
import type { ReelShortBook, ReelShortBanner } from "@/types/reelshort";

export function ReelShortSection() {
  const { data, isLoading, error, refetch } = useReelShortHomepage();

  // Group content by sections
  const sections = useMemo(() => {
    if (!data?.data?.lists) return { banners: [], bookGroups: [] };

    const tabs = data.data.tab_list || [];
    const popularTab = tabs.find((t) => t.tab_name === "POPULER") || tabs[0];
    
    if (!popularTab) return { banners: [], bookGroups: [] };

    const tabLists = data.data.lists.filter((list) => list.tab_id === popularTab.tab_id);
    
    const banners: ReelShortBanner[] = [];
    const bookGroups: { title: string; books: ReelShortBook[] }[] = [];
    
    tabLists.forEach((list, index) => {
      if (list.banners && list.banners.length > 0) {
        banners.push(...list.banners);
      }
      if (list.books && list.books.length > 0) {
        const sectionNames = ["Populer", "Terbaru", "Trending", "Untuk Kamu"];
        const title = sectionNames[index] || `Section ${index + 1}`;
        bookGroups.push({ title, books: list.books });
      }
    });

    return { banners, bookGroups };
  }, [data]);

  if (error) {
    return (
      <UnifiedErrorDisplay 
        title="Gagal Memuat ReelShort"
        message="Terjadi kesalahan saat mengambil data dari server."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-[270px] sm:h-[330px] lg:h-[390px] rounded-3xl bg-muted/50 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SectionSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { banners, bookGroups } = sections;

  // Banner standar: pakai banner resmi homepage bila ada; bila upstream tidak
  // mengirim banner (teramati 20 Okt 2026: tab Populer tanpa banner), cadangkan
  // dari 5 judul teratas grup pertama agar ReelShort tetap ber-banner seperti
  // platform lain.
  const bannerItems =
    banners.length > 0
      ? banners.slice(0, 5).map((b) => ({
          id: b.jump_param.book_id,
          title: b.jump_param.book_title,
          cover: b.pic,
          poster: b.jump_param.book_pic,
          href: `/detail/reelshort/${b.jump_param.book_id}`,
          meta: b.jump_param.chapter_count
            ? `${b.jump_param.chapter_count} Episode`
            : undefined,
        }))
      : (bookGroups[0]?.books || [])
          .filter((book) => book.book_id && book.book_pic)
          .slice(0, 5)
          .map((book) => ({
            id: book.book_id,
            title: book.book_title,
            cover: book.book_pic,
            href: `/detail/reelshort/${book.book_id}`,
            meta: book.chapter_count
              ? `${book.chapter_count} Episode`
              : undefined,
          }));

  return (
    <div className="space-y-8">
      {/* Banner Carousel — standar semua platform (20 Okt 2026),
          menggantikan carousel pita tipis 3:1 lama */}
      {bannerItems.length > 0 && (
        <HomeBannerCarousel platformName="ReelShort" items={bannerItems} />
      )}

      {/* Book Sections - Grid Layout */}
      {bookGroups.map((group, index) => (
        <section key={index}>
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
            {group.title}
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {group.books
              .filter((book) => book.book_id && book.book_pic)
              .slice(0, 16)
              .map((book, index) => (
                <UnifiedMediaCard 
                  key={book.book_id} 
                  index={index}
                  title={book.book_title}
                  cover={book.book_pic}
                  link={`/detail/reelshort/${book.book_id}`}
                  episodes={book.chapter_count}
                  topLeftBadge={book.book_mark?.text ? {
                    text: book.book_mark.text,
                    color: book.book_mark.color || "#E52E2E",
                    textColor: book.book_mark.text_color
                  } : null}
                  topRightBadge={book.rank_level ? {
                    text: book.rank_level,
                    isTransparent: true
                  } : null}
                />
              ))}
          </div>
        </section>
      ))}

      {/* Infinite Scroll Section */}
      <InfiniteReelShortSection title="Lainnya" />

    </div>
  );
}

function SectionSkeleton() {
  return (
    <div>
      <div className="h-6 w-32 bg-muted/50 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] rounded-lg bg-muted/50 animate-pulse" />
            <div className="mt-1.5 h-3 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
