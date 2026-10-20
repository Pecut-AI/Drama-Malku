
"use client";

import { useFreeReelsHome, useFreeReelsAnime, FreeReelsModule, FreeReelsItem } from "@/hooks/useFreeReels";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { InfiniteFreeReelsSection } from "./InfiniteFreeReelsSection";
import { HomeBannerCarousel } from "./HomeBannerCarousel";

// Helper to extract items from a module, handling special cases like 'recommend'
function getModuleItems(module: FreeReelsModule): FreeReelsItem[] {
  if (module.type === "recommend" && module.items && module.items.length > 0) {
    // Check for nested module_card
    const firstItem = module.items[0];
    if (firstItem.module_card && firstItem.module_card.items) {
      return firstItem.module_card.items as FreeReelsItem[];
    }
  }
  return module.items || [];
}

// Helper Component for Section Skeleton
function SectionLoader({ count = 6, titleWidth = "w-48" }: { count?: number, titleWidth?: string }) {
  return (
    <section className="space-y-4">
      {/* Title Skeleton */}
      <div className={`h-7 md:h-8 ${titleWidth} bg-white/10 rounded-lg animate-pulse`} />
      
      {/* Grid Skeleton - Matches main grid exactly */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <UnifiedMediaCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// Helper to clean title (remove emojis)
function cleanTitle(title: string): string {
  // Removes standard emojis and specific ones like 🎉
  return title.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
}

export function FreeReelsHome() {


  const { 
    data: homeData, 
    isLoading: loadingHome, 
    error: errorHome, 
    refetch: refetchHome 
  } = useFreeReelsHome();

  const { 
    data: animeData, 
    isLoading: loadingAnime, 
    error: errorAnime, 
    refetch: refetchAnime 
  } = useFreeReelsAnime();

  // Banner carousel standar dari modul beranda pertama yang berisi judul valid
  const bannerItems = (() => {
    const modules = homeData?.data?.items || [];
    for (const mod of modules) {
      if (mod.type === "coming_soon") continue;
      const valid = getModuleItems(mod).filter((i) => i.title && i.cover);
      if (valid.length > 0) {
        return valid.slice(0, 5).map((item) => ({
          id: item.key,
          title: item.title,
          cover: item.cover,
          href: `/detail/freereels/${item.key}`,
          meta: item.episode_count ? `${item.episode_count} Episode` : undefined,
        }));
      }
    }
    return [];
  })();

  // Error kini PER SEKSI (20 Okt 2026): modul beranda dan anime gagal sendiri-
  // sendiri dengan tombol coba lagi masing-masing, bukan lagi layar penuh.
  return (
    <div className="space-y-8 pb-20">
      {bannerItems.length > 0 && (
        <HomeBannerCarousel items={bannerItems} platformName="FreeReels" />
      )}

      {/* SECTION: Homepage Modules */}
      {loadingHome ? (
        <SectionLoader count={6} titleWidth="w-40" />
      ) : errorHome ? (
        <UnifiedErrorDisplay
          title="Gagal Memuat FreeReels"
          message="Tidak dapat mengambil data beranda saat ini."
          onRetry={() => refetchHome()}
        />
      ) : (
        homeData?.data?.items
          ?.filter(module => module.type !== 'coming_soon')
          .map((module, mIdx) => {
           const items = getModuleItems(module);
           if (!items || items.length === 0) return null;
           
           // Skip if all items are invalid
           const validItems = items.filter(item => item.title && item.cover);
           if (validItems.length === 0) return null;

           const title = (module.module_name ? cleanTitle(module.module_name) : "") || "Rekomendasi Untukmu";

           return (
            <section key={`home-module-${mIdx}`} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
                  {title}
                </h2>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {validItems.map((item, idx) => (
                  <UnifiedMediaCard
                    key={`${item.key}-home-${mIdx}-${idx}`}
                    title={item.title}
                    cover={item.cover}
                    link={`/detail/freereels/${item.key}`}
                    episodes={item.episode_count || 0}
                    topRightBadge={item.follow_count ? { text: `${(item.follow_count / 1000).toFixed(1)}k`, isTransparent: true } : null}
                  />
                ))}
              </div>
            </section>
           );
        })
      )}

      {/* SECTION: Anime Modules */}
      {loadingAnime ? (
        <SectionLoader count={6} titleWidth="w-40" />
      ) : errorAnime ? (
        <UnifiedErrorDisplay
          title="Gagal Memuat Anime"
          message="Tidak dapat mengambil data anime saat ini."
          onRetry={() => refetchAnime()}
        />
      ) : (
        animeData?.data?.items && animeData.data.items.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
                Anime
              </h2>
            </div>
            
            <div className="space-y-8">
              {animeData.data.items.map((module, mIdx) => {
                const items = getModuleItems(module);
                if (!items || items.length === 0) return null;

                const validItems = items.filter(item => item.title && item.cover);
                if (validItems.length === 0) return null;

                return (
                  <div key={`anime-module-${mIdx}`} className="space-y-4">
                    {module.module_name && cleanTitle(module.module_name) !== "" && (
                      <h3 className="font-display font-semibold text-lg text-foreground/90">
                        {cleanTitle(module.module_name)}
                      </h3>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                      {validItems.map((item, idx) => (
                        <UnifiedMediaCard
                          key={`${item.key}-anime-${mIdx}-${idx}`}
                          title={item.title}
                          cover={item.cover}
                          link={`/detail/freereels/${item.key}`}
                          episodes={item.episode_count || 0}
                          topRightBadge={item.follow_count ? { text: `${(item.follow_count / 1000).toFixed(1)}k`, isTransparent: true } : null}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}

      {/* SECTION: Infinite Scroll / Lainnya */}
      <InfiniteFreeReelsSection title="Lainnya" />

    </div>
  );
}
