"use client";

// Beranda generik untuk platform bersumber dramaletto dengan bentuk data
// pola NetShort (moboreels, dramawave, vibeshort). Mengikuti struktur
// NetShortHome: banner dari Untukmu, rak Lanjut Menonton, seksi per grup
// theater, lalu gulir tanpa batas. Error ditangani per seksi.
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import {
  useDlTheaters,
  useDlForYou,
  useDlInfinite,
  type DlPlatformSlug,
} from "@/hooks/useDramalettoPlatform";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { HomeBannerCarousel } from "./HomeBannerCarousel";
import { ContinueWatchingShelf } from "./ContinueWatchingShelf";

function stripEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F550}-\u{1F567}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE0F}]/gu, '').trim();
}

const EXCLUDED_SECTIONS = ['segera tayang', 'coming soon', 'upcoming'];

function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, cardIndex) => (
        <UnifiedMediaCardSkeleton key={cardIndex} index={cardIndex} />
      ))}
    </div>
  );
}

interface Props {
  provider: DlPlatformSlug;
  name: string;
}

export function DramalettoHome({ provider, name }: Props) {
  const { data: theatersData, isLoading: loadingTheaters, error: errorTheaters, refetch: refetchTheaters } = useDlTheaters(provider);
  const { data: forYouData, isLoading: loadingForYou, error: errorForYou, refetch: refetchForYou } = useDlForYou(provider);

  const filteredGroups = (theatersData?.data || []).filter((group) => {
    const sectionName = stripEmoji(group.groupName).toLowerCase();
    return !EXCLUDED_SECTIONS.some((excluded) => sectionName.includes(excluded));
  });

  const bannerItems = (forYouData?.data || []).slice(0, 5).map((drama) => ({
    id: drama.shortPlayId,
    title: drama.title,
    cover: drama.cover,
    href: `/detail/${provider}/${drama.shortPlayId}`,
    meta: drama.totalEpisodes ? `${drama.totalEpisodes} Episode` : undefined,
    tags: drama.labels?.slice(0, 3),
  }));

  const card = (drama: any, index: number) => (
    <UnifiedMediaCard
      key={drama.shortPlayId}
      index={index}
      title={drama.title}
      cover={drama.cover}
      link={`/detail/${provider}/${drama.shortPlayId}`}
      episodes={drama.totalEpisodes}
      meta={drama.labels?.slice(0, 2).join(" • ") || undefined}
      topLeftBadge={drama.scriptName ? { text: drama.scriptName, color: "#E52E2E" } : null}
      topRightBadge={drama.heatScore ? { text: drama.heatScore, isTransparent: true } : null}
    />
  );

  return (
    <div className="space-y-10">
      {bannerItems.length > 0 && (
        <HomeBannerCarousel items={bannerItems} platformName={name} platform={provider} />
      )}

      <ContinueWatchingShelf />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-display text-foreground">
            Rekomendasi Untukmu
          </h2>
        </div>
        {loadingForYou ? (
          <GridSkeleton />
        ) : errorForYou ? (
          <UnifiedErrorDisplay
            title="Gagal Memuat Rekomendasi"
            message={`Tidak dapat terhubung ke layanan ${name}.`}
            onRetry={() => refetchForYou()}
          />
        ) : forYouData?.data && forYouData.data.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {forYouData.data.map(card)}
          </div>
        ) : null}
      </section>

      {loadingTheaters ? (
        <section>
          <div className="h-7 w-48 bg-muted/50 rounded animate-pulse mb-4" />
          <GridSkeleton />
        </section>
      ) : errorTheaters ? (
        <section>
          <UnifiedErrorDisplay
            title="Gagal Memuat Daftar Theater"
            message={`Tidak dapat terhubung ke layanan ${name}.`}
            onRetry={() => refetchTheaters()}
          />
        </section>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.groupId}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-display text-foreground">
                {stripEmoji(group.groupName)}
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {group.dramas.slice(0, 12).map(card)}
            </div>
          </section>
        ))
      )}

      <InfiniteDlSection provider={provider} title="Lainnya" />
    </div>
  );
}

function InfiniteDlSection({ provider, title }: { provider: DlPlatformSlug; title: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useDlInfinite(provider);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allDramas = data?.pages.flatMap((page) => page.data) || [];

  if (isError) {
    return (
      <section>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">{title}</h2>
        <UnifiedErrorDisplay
          title={`Gagal Memuat ${title}`}
          message="Tidak dapat mengambil data drama."
          onRetry={() => refetch()}
        />
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="space-y-4">
        <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <UnifiedMediaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {allDramas.map((drama, index) => (
          <UnifiedMediaCard
            key={`${drama.shortPlayId}-${index}`}
            index={index}
            title={drama.title}
            cover={drama.cover}
            link={`/detail/${provider}/${drama.shortPlayId}`}
            episodes={drama.totalEpisodes}
            meta={drama.labels?.slice(0, 2).join(" • ") || undefined}
            topRightBadge={drama.heatScore ? { text: drama.heatScore, isTransparent: true } : null}
          />
        ))}
      </div>
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
      </div>
    </section>
  );
}
