"use client";


import { DramaSection } from "@/components/DramaSection";
import { ReelShortSection } from "@/components/ReelShortSection";
import { ShortMaxHome } from "@/components/ShortMaxHome";
import { NetShortHome } from "@/components/NetShortHome";
import { MeloloHome } from "@/components/MeloloHome";

import { FreeReelsHome } from "@/components/FreeReelsHome";
import { DramaNovaHome } from "@/components/DramaNovaHome";
import { GoodShortHome } from "@/components/GoodShortHome";
import { FlickReelsHome } from "@/components/FlickReelsHome";
import { PineDramaHome } from "@/components/PineDramaHome";
import { useLatestDramas, useTrendingDramas, useDubindoDramas } from "@/hooks/useDramas";
import { usePlatform } from "@/hooks/usePlatform";
import { InfiniteDramaSection } from "@/components/InfiniteDramaSection";
import { ContinueWatchingShelf } from "@/components/ContinueWatchingShelf";
import { HomeBannerCarousel } from "@/components/HomeBannerCarousel";

export default function HomeContent() {
  const { isPineDrama, isDramaBox, isReelShort, isShortMax, isNetShort, isMelolo, isFreeReels, isDramaNova, isGoodShort, isFlickReels } = usePlatform();

  // Fetch data for all DramaBox sections
  // const { data: popularDramas, isLoading: loadingPopular, error: errorPopular, refetch: refetchPopular } = useForYouDramas(); // REMOVED as requested (replaced by infinite scroll)
  const { data: latestDramas, isLoading: loadingLatest, error: errorLatest, refetch: refetchLatest } = useLatestDramas();
  const { data: trendingDramas, isLoading: loadingTrending, error: errorTrending, refetch: refetchTrending } = useTrendingDramas();
  const { data: dubindoDramas, isLoading: loadingDubindo, error: errorDubindo, refetch: refetchDubindo } = useDubindoDramas();

  return (
    <main className="min-h-screen pt-16">

      {/* PineDrama Content */}
      {isPineDrama && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <PineDramaHome />
        </div>
      )}

      {/* DramaBox Content - Multiple Sections */}
      {isDramaBox && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          {/* Banner carousel standar dari 5 judul teratas Terpopuler */}
          {trendingDramas && trendingDramas.length > 0 && (
            <HomeBannerCarousel
              platformName="DramaBox"
              items={trendingDramas
                .filter((d) => d.cover || d.coverWap)
                .slice(0, 5)
                .map((d) => ({
                  id: d.bookId,
                  title: d.bookName,
                  cover: d.cover || d.coverWap || "",
                  href: `/detail/dramabox/${d.bookId}`,
                  meta: d.chapterCount ? `${d.chapterCount} Episode` : undefined,
                  description: d.introduction || undefined,
                  tags: d.tagNames?.slice(0, 3),
                }))}
            />
          )}

          {/* Lanjut Menonton — di bawah banner (permintaan Elnath 20 Okt) */}
          <ContinueWatchingShelf />

          <DramaSection
            title="Terbaru"
            dramas={latestDramas}
            isLoading={loadingLatest}
            error={!!errorLatest}
            onRetry={() => refetchLatest()}
          />
          <DramaSection
            title="Terpopuler"
            dramas={trendingDramas}
            isLoading={loadingTrending}
            error={!!errorTrending}
            onRetry={() => refetchTrending()}
          />
          <DramaSection
            title="Dubindo"
            dramas={dubindoDramas}
            isLoading={loadingDubindo}
            error={!!errorDubindo}
            onRetry={() => refetchDubindo()}
          />

          {/* Infinite Scroll Section */}
          <InfiniteDramaSection title="Lainnya" />
        </div>
      )}

      {/* ReelShort Content - Multiple Sections */}
      {isReelShort && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <ReelShortSection />
        </div>
      )}

      {/* ShortMax Content */}
      {isShortMax && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <ShortMaxHome />
        </div>
      )}

      {/* NetShort Content */}
      {isNetShort && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <NetShortHome />
        </div>
      )}

      {/* Melolo Content */}
      {isMelolo && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <MeloloHome />
        </div>
      )}



      {/* FreeReels Content */}
      {isFreeReels && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <FreeReelsHome />
        </div>
      )}

      {/* DramaNova Content */}
      {isDramaNova && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <DramaNovaHome />
        </div>
      )}

      {/* GoodShort Content */}
      {isGoodShort && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <GoodShortHome />
        </div>
      )}

      {/* FlickReels Content */}
      {isFlickReels && (
        <div className="container mx-auto px-4 py-6 space-y-8">
          <FlickReelsHome />
        </div>
      )}
    </main>
  );
}

