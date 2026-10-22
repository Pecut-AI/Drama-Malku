"use client";

// Hook generik untuk platform yang sumbernya dramaletto.com dan bentuk
// respons API-nya mengikuti pola NetShort (moboreels, dramawave,
// vibeshort). Tipe datanya sama persis dengan useNetShort.
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";
import type {
  NetShortDrama,
  NetShortGroup,
  DetailResponse,
  EpisodeResponse,
} from "@/hooks/useNetShort";

export type DlPlatformSlug = "moboreels" | "dramawave" | "vibeshort";

interface TheatersResponse {
  success: boolean;
  data: NetShortGroup[];
}

interface ForYouResponse {
  success: boolean;
  data: NetShortDrama[];
  maxOffset?: number;
  completed?: boolean;
}

interface SearchResponse {
  success: boolean;
  data: NetShortDrama[];
}

export function useDlTheaters(provider: DlPlatformSlug) {
  return useQuery<TheatersResponse>({
    queryKey: [provider, "theaters"],
    queryFn: () => fetchJson<TheatersResponse>(`/api/${provider}/theaters`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDlForYou(provider: DlPlatformSlug, page = 1) {
  return useQuery<ForYouResponse>({
    queryKey: [provider, "foryou", page],
    queryFn: () => fetchJson<ForYouResponse>(`/api/${provider}/foryou?page=${page}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDlInfinite(provider: DlPlatformSlug) {
  return useInfiniteQuery<ForYouResponse>({
    queryKey: [provider, "foryou", "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      fetchJson<ForYouResponse>(`/api/${provider}/foryou?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.completed || allPages.length >= 100) return undefined;
      // Berhenti bila halaman terakhir tidak menyumbang judul baru sama
      // sekali (browse VibeShort di dramaletto mengembalikan daftar yang
      // sama untuk semua halaman — tanpa ini gulirnya berputar selamanya).
      const seenBefore = new Set(
        allPages.slice(0, -1).flatMap((p) => p.data.map((d) => d.shortPlayId))
      );
      const hasFresh = lastPage.data.some((d) => !seenBefore.has(d.shortPlayId));
      return hasFresh ? allPages.length + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDlSearch(provider: DlPlatformSlug, query: string) {
  return useQuery<SearchResponse>({
    queryKey: [provider, "search", query],
    queryFn: () =>
      fetchJson<SearchResponse>(
        `/api/${provider}/search?query=${encodeURIComponent(query)}`
      ),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useDlDetail(provider: DlPlatformSlug, id: string) {
  return useQuery<DetailResponse>({
    queryKey: [provider, "detail", id],
    queryFn: () =>
      fetchJson<DetailResponse>(
        `/api/${provider}/detail?shortPlayId=${encodeURIComponent(id)}`
      ),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDlEpisode(provider: DlPlatformSlug, id: string, episodeNumber: number) {
  return useQuery<EpisodeResponse>({
    queryKey: [provider, "episode", id, episodeNumber],
    queryFn: () =>
      fetchJson<EpisodeResponse>(
        `/api/${provider}/episode?shortPlayId=${encodeURIComponent(id)}&episodeNumber=${episodeNumber}`
      ),
    enabled: !!id && episodeNumber > 0,
    staleTime: 5 * 60 * 1000,
  });
}
