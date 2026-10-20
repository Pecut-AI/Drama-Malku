"use client";

import { PineDramaSection } from "./PineDramaSection";
import { InfinitePineDramaSection } from "./InfinitePineDramaSection";
import { HomeBannerCarousel } from "./HomeBannerCarousel";
import { usePineDramaTrending } from "@/hooks/usePineDrama";

export function PineDramaHome() {
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = usePineDramaTrending();

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Banner carousel standar dari 5 judul teratas Trending */}
      {trendingData && trendingData.length > 0 && (
        <HomeBannerCarousel
          platformName="PineDrama"
          items={trendingData.slice(0, 5).map((d) => ({
            id: d.collection_id,
            title: d.title,
            cover: d.cover,
            href: `/detail/pinedrama/${d.collection_id}`,
            meta: d.total_episodes ? `${d.total_episodes} Episode` : undefined,
            description: d.description || undefined,
          }))}
        />
      )}
      <PineDramaSection
        title="Trending"
        dramas={trendingData}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <InfinitePineDramaSection title="Lainnya" />
    </div>
  );
}
