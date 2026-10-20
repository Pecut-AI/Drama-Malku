"use client";

import { GoodShortSection } from "./GoodShortSection";
import { InfiniteGoodShortSection } from "./InfiniteGoodShortSection";
import { HomeBannerCarousel } from "./HomeBannerCarousel";
import { useGoodShortLatest, useGoodShortTrending } from "@/hooks/useGoodShort";

export function GoodShortHome() {
  const { 
    data: latestData, 
    isLoading: loadingLatest, 
    error: errorLatest, 
    refetch: refetchLatest 
  } = useGoodShortLatest();

  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = useGoodShortTrending();

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Banner carousel standar dari 5 judul teratas Trending */}
      {trendingData && trendingData.length > 0 && (
        <HomeBannerCarousel
          platformName="GoodShort"
          items={trendingData.slice(0, 5).map((d) => ({
            id: d.bookId,
            title: d.bookName,
            cover: d.cover,
            href: `/detail/goodshort/${d.bookId}`,
            meta: d.chapterCount ? `${d.chapterCount} Episode` : undefined,
            description: d.introduction || undefined,
          }))}
        />
      )}
      <GoodShortSection
        title="Terbaru"
        dramas={latestData}
        isLoading={loadingLatest}
        error={!!errorLatest}
        onRetry={() => refetchLatest()}
      />
      <GoodShortSection
        title="Trending"
        dramas={trendingData}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <InfiniteGoodShortSection title="Lainnya" />
    </div>
  );
}
