"use client";

import {
  useMeloloLatest,
  useMeloloTrending,
  type MeloloBook,
} from "@/hooks/useMelolo";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { JelajahiMeloloSection } from "./JelajahiMeloloSection";
import { HomeBannerCarousel } from "./HomeBannerCarousel";

function MeloloGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] rounded-xl bg-muted/30 animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-muted/30 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function BookGrid({ books }: { books: MeloloBook[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
      {books.map((book, index) => (
        <UnifiedMediaCard
          key={book.book_id}
          title={book.book_name}
          cover={book.thumb_url}
          link={`/detail/melolo/${book.book_id}`}
          episodes={book.serial_count || 0}
          topLeftBadge={null}
          index={index}
        />
      ))}
    </div>
  );
}

export function MeloloHome() {
  const {
    data: latestData,
    isLoading: loadingLatest,
    error: errorLatest,
    refetch: refetchLatest,
  } = useMeloloLatest();

  const {
    data: trendingData,
    isLoading: loadingTrending,
    error: errorTrending,
    refetch: refetchTrending,
  } = useMeloloTrending();

  const trendingBooks = trendingData?.books ?? [];
  const latestBooks = latestData?.books ?? [];

  // Banner carousel standar dari 5 judul teratas Sedang Hangat
  const bannerItems = trendingBooks.slice(0, 5).map((book) => ({
    id: book.book_id,
    title: book.book_name,
    cover: book.thumb_url,
    href: `/detail/melolo/${book.book_id}`,
    meta: book.serial_count ? `${book.serial_count} Episode` : undefined,
    description: book.abstract || undefined,
  }));

  // Error & loading kini PER SEKSI (20 Okt 2026): satu seksi gagal tidak lagi
  // mengosongkan seluruh beranda; tiap seksi punya tombol coba lagi sendiri.
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {bannerItems.length > 0 && (
        <HomeBannerCarousel items={bannerItems} platformName="Melolo" />
      )}

      {/* Trending Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
            Sedang Hangat
          </h2>
        </div>
        {loadingTrending ? (
          <MeloloGridSkeleton />
        ) : errorTrending ? (
          <UnifiedErrorDisplay
            title="Gagal Memuat Sedang Hangat"
            message="Tidak dapat mengambil data trending saat ini."
            onRetry={() => refetchTrending()}
          />
        ) : trendingBooks.length > 0 ? (
          <BookGrid books={trendingBooks} />
        ) : null}
      </section>

      {/* Latest Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
            Rilis Baru
          </h2>
        </div>
        {loadingLatest ? (
          <MeloloGridSkeleton />
        ) : errorLatest ? (
          <UnifiedErrorDisplay
            title="Gagal Memuat Rilis Baru"
            message="Tidak dapat mengambil data rilis terbaru saat ini."
            onRetry={() => refetchLatest()}
          />
        ) : latestBooks.length > 0 ? (
          <BookGrid books={latestBooks} />
        ) : null}
      </section>

      {/* Jelajahi: katalog tambahan dari panen pencarian berkala (cache 1 jam).
          Seksi "Lainnya" (feed foryou) dihapus 20 Okt 2026 atas permintaan Elnath
          karena perannya sudah digantikan Jelajahi. */}
      <JelajahiMeloloSection />

      {!loadingLatest &&
        !loadingTrending &&
        !errorLatest &&
        !errorTrending &&
        latestBooks.length === 0 &&
        trendingBooks.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            Tidak ada konten tersedia saat ini.
          </div>
        )}
    </div>
  );
}
