"use client";

import { useFlickReelsLatest } from "@/hooks/useFlickReels";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { InfiniteFlickReelsSection } from "./InfiniteFlickReelsSection";
import { HomeBannerCarousel } from "./HomeBannerCarousel";
import { ContinueWatchingShelf } from "./ContinueWatchingShelf";

export function FlickReelsHome() {
  const {
    data: latestData,
    isLoading: loadingLatest,
    error: errorLatest,
    refetch: refetchLatest,
  } = useFlickReelsLatest();

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Banner carousel standar dari 5 judul teratas Terbaru */}
      {latestData?.data && latestData.data.length > 0 && (
        <HomeBannerCarousel
          platformName="FlickReels"
          platform="flickreels"
          items={latestData.data.slice(0, 5).map((d) => ({
            id: String(d.playletId),
            title: d.title,
            cover: d.cover,
            href: `/detail/flickreels/${d.playletId}`,
            meta: d.totalEpisodes ? `${d.totalEpisodes} Episode` : undefined,
            tags: d.tags?.slice(0, 3),
          }))}
        />
      )}

      <ContinueWatchingShelf />

      {/* Terbaru Section */}
      <section>
        {errorLatest || (!loadingLatest && (!latestData?.data || latestData.data.length === 0)) ? (
          <>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
              Terbaru
            </h2>
            <UnifiedErrorDisplay
              title="Gagal Memuat Drama Terbaru"
              message="Tidak dapat mengambil data drama."
              onRetry={() => refetchLatest()}
            />
          </>
        ) : loadingLatest ? (
          <>
            <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <UnifiedMediaCardSkeleton key={i} index={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
              Terbaru
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {latestData!.data.map((drama, index) => (
                <UnifiedMediaCard
                  key={`latest-${drama.playletId}-${index}`}
                  index={index}
                  title={drama.title}
                  cover={drama.cover}
                  link={`/detail/flickreels/${drama.playletId}`}
                  episodes={drama.totalEpisodes}
                  meta={drama.hotNum || undefined}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Infinite Scroll Section */}
      <InfiniteFlickReelsSection title="Lainnya" />
    </div>
  );
}
