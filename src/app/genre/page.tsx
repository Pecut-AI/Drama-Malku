"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import { UnifiedMediaCard } from "@/components/UnifiedMediaCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORMS, usePlatformStore, type Platform } from "@/hooks/usePlatform";
import { fetchJson } from "@/lib/fetcher";

/**
 * Halaman Genre (23 Okt 2026, daftar chip jadi statis 30 Okt 2026).
 *
 * Daftar chip genre adalah DAFTAR STATIS kata kunci drama pendek yang
 * umum — bukan data resmi dari penyedia mana pun. Judul per genre dicari
 * lewat endpoint pencarian platform yang sedang aktif, memakai nama genre
 * sebagai kata kunci — pola yang sama untuk semua platform.
 */

interface GenreInfo {
  slug: string;
  name: string;
  count?: number;
  aliases?: string[];
}

// Daftar statis kata kunci genre drama pendek (bukan data resmi).
const STATIC_GENRES: GenreInfo[] = [
  { slug: "ceo", name: "CEO" },
  { slug: "romantis", name: "Romantis" },
  { slug: "balas-dendam", name: "Balas Dendam" },
  { slug: "pernikahan", name: "Pernikahan" },
  { slug: "pernikahan-kontrak", name: "Pernikahan Kontrak" },
  { slug: "pewaris", name: "Pewaris" },
  { slug: "mafia", name: "Mafia" },
  { slug: "dokter", name: "Dokter" },
  { slug: "keluarga-kaya", name: "Keluarga Kaya" },
  { slug: "bangkit-kembali", name: "Bangkit Kembali" },
  { slug: "fantasi", name: "Fantasi" },
  { slug: "keluarga", name: "Keluarga" },
  { slug: "perkotaan", name: "Perkotaan" },
  { slug: "cinta", name: "Cinta" },
];

interface GenreItem {
  id: string;
  title: string;
  cover: string;
  href: string;
  tags: string[];
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function extractItems(platformId: Platform, raw: any): GenreItem[] {
  const map = (fn: (d: any) => GenreItem) => {
    const seen = new Set<string>();
    const out: GenreItem[] = [];
    for (const d of asArray(raw)) {
      const item = fn(d);
      if (!item.id || !item.title || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      if (out.length >= 24) break;
    }
    return out;
  };
  switch (platformId) {
    case "pinedrama":
      return map((d) => ({
        id: String(d.collection_id ?? ""),
        title: (d.title || "").replace(/<\/?em>/g, ""),
        cover: d.cover,
        href: `/detail/pinedrama/${d.collection_id}`,
        tags: d.tags || [],
      }));
    case "dramabox":
      return map((d) => ({
        id: String(d.bookId ?? ""),
        title: d.bookName || "",
        cover: d.cover,
        href: `/detail/dramabox/${d.bookId}`,
        tags: d.tagNames || [],
      }));
    case "reelshort":
      return map((b) => ({
        id: String(b.book_id ?? ""),
        title: b.book_title || "",
        cover: b.book_pic,
        href: `/detail/reelshort/${b.book_id}`,
        tags: b.theme || [],
      }));
    case "shortmax":
      return map((d) => ({
        id: String(d.shortPlayId ?? ""),
        title: d.title || "",
        cover: d.cover,
        href: `/detail/shortmax/${d.shortPlayId}`,
        tags: d.genre || [],
      }));
    case "goodshort":
      return map((b) => ({
        id: String(b.bookId ?? ""),
        title: b.bookName || "",
        cover: b.cover,
        href: `/detail/goodshort/${b.bookId}`,
        tags: b.labels || [],
      }));
    case "melolo": {
      const books =
        raw?.data?.search_data?.flatMap((item: any) => item.books || []) || [];
      const seen = new Set<string>();
      const out: GenreItem[] = [];
      for (const b of books) {
        const id = String(b.book_id ?? "");
        if (!id || !b.book_name || seen.has(id) || !b.thumb_url) continue;
        seen.add(id);
        out.push({
          id,
          title: b.book_name,
          cover: b.thumb_url,
          href: `/detail/melolo/${b.book_id}`,
          tags: (b.stat_infos || []).slice(0, 1),
        });
        if (out.length >= 24) break;
      }
      return out;
    }
    case "freereels":
      return map((b) => ({
        id: String(b.key ?? ""),
        title: b.title || "",
        cover: b.cover,
        href: `/detail/freereels/${b.key}`,
        tags: b.content_tags || [],
      }));
    case "flickreels":
      return map((d) => ({
        id: String(d.playletId ?? ""),
        title: d.title || "",
        cover: d.cover,
        href: `/detail/flickreels/${d.playletId}`,
        tags: d.tags || [],
      }));
    default:
      // netshort (bentuk shortPlayId)
      return map((d) => ({
        id: String(d.shortPlayId ?? ""),
        title: d.title || "",
        cover: d.cover,
        href: `/detail/${platformId}/${d.shortPlayId}`,
        tags: d.labels || [],
      }));
  }
}

async function searchGenre(
  platform: Platform,
  genre: GenreInfo
): Promise<GenreItem[]> {
  const url = (q: string) =>
    `/api/${platform}/search?query=${encodeURIComponent(q)}`;
  let items = extractItems(platform, await fetchJson<any>(url(genre.name)));
  if (items.length < 3 && genre.aliases?.length) {
    for (const alias of genre.aliases.slice(0, 2)) {
      try {
        const more = extractItems(platform, await fetchJson<any>(url(alias)));
        const seen = new Set(items.map((i) => i.id));
        items = [...items, ...more.filter((i) => !seen.has(i.id))].slice(0, 24);
        if (items.length >= 6) break;
      } catch {
        // alias gagal — lanjut dengan hasil yang ada
      }
    }
  }
  return items;
}

export default function GenrePage() {
  const currentPlatform = usePlatformStore((s) => s.currentPlatform);
  const [selected, setSelected] = useState<GenreInfo | null>(null);

  // Chip genre statis (tidak lagi mengambil dari API mana pun).
  const genres: GenreInfo[] = STATIC_GENRES;

  const activeGenre = selected ?? genres[0];
  const platformInfo = PLATFORMS.find((p) => p.id === currentPlatform);

  const resultsQuery = useQuery({
    queryKey: ["genre", currentPlatform, activeGenre?.slug],
    queryFn: () => searchGenre(currentPlatform, activeGenre!),
    enabled: !!activeGenre,
    staleTime: 5 * 60 * 1000,
  });
  const items = resultsQuery.data || [];

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <LayoutGrid className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl md:text-3xl font-bold">Genre</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Menampilkan genre untuk platform aktif:{" "}
        <span className="text-foreground font-medium">{platformInfo?.name}</span>.
        Ganti platform lewat pemilih di bagian atas bila ingin menjelajahi
        genre di platform lain.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {genres.map((g) => {
          const active = activeGenre?.slug === g.slug;
          return (
            <button
              key={g.slug}
              type="button"
              onClick={() => setSelected(g)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 hover:bg-white/10 border border-white/10"
              }`}
            >
              {g.name}
              {typeof g.count === "number" && (
                <span className={active ? "opacity-80" : "text-muted-foreground"}>
                  {" "}· {g.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {resultsQuery.isLoading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
          ))}
        </div>
      )}

      {!resultsQuery.isLoading && items.length === 0 && (
        <p className="text-muted-foreground py-16 text-center">
          Belum ada judul yang cocok untuk genre {activeGenre?.name} di{" "}
          {platformInfo?.name}. Coba genre atau platform lain.
        </p>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {items.map((item, i) => (
            <UnifiedMediaCard
              key={item.id}
              title={item.title}
              cover={item.cover || ""}
              link={item.href}
              meta={item.tags.slice(0, 2).join(" • ") || undefined}
              index={i}
            />
          ))}
        </div>
      )}
    </main>
  );
}
