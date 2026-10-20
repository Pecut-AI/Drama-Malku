"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Play } from "lucide-react";
import { useSearchDramas } from "@/hooks/useDramas";
import { useReelShortSearch } from "@/hooks/useReelShort";
import { useNetShortSearch } from "@/hooks/useNetShort";
import { useShortMaxSearch } from "@/hooks/useShortMax";
import { useMeloloSearch } from "@/hooks/useMelolo";
import { useFreeReelsSearch } from "@/hooks/useFreeReels";
import { useGoodShortSearch } from "@/hooks/useGoodShort";
import { usePineDramaSearch } from "@/hooks/usePineDrama";
import { useFlickReelsSearch } from "@/hooks/useFlickReels";
import { usePlatform, type Platform, type PlatformInfo } from "@/hooks/usePlatform";
import { useDebounce } from "@/hooks/useDebounce";
import { usePathname } from "next/navigation";
import { optimizeThumb } from "@/lib/image-utils";

/**
 * Pencarian global model klik-chip (20 Okt 2026): satu kolom pencarian untuk
 * SEMUA platform, tetapi yang otomatis dicari hanya platform aktif. Platform
 * lain baru dicari saat chip-nya diklik pengguna; chip yang aktif selalu
 * mengikuti platform yang sedang dipilih (chip "Semua Platform" dihapus atas
 * permintaan Elnath — hasil ditampilkan per platform yang dipilih lewat chip).
 * Model ini dipilih Elnath agar beban ke API Sansekai (batas demo
 * ±10 request/menit, dibagi semua pengunjung) jauh lebih aman daripada
 * menelusuri semua platform setiap kali mengetik.
 *
 * Bentuk data pencarian tiap platform berbeda-beda, jadi setiap platform
 * punya adaptor kecil yang menormalkan hasilnya ke GlobalSearchItem.
 */

const MIN_QUERY_LENGTH = 3;
const MAX_ITEMS_PER_PLATFORM = 10;

interface GlobalSearchItem {
  id: string;
  title: string;
  cover?: string;
  href: string;
  description?: string;
  tags?: string[];
}

interface GlobalSearchGroup {
  platform: PlatformInfo;
  items: GlobalSearchItem[];
  isLoading: boolean;
  isError: boolean;
}

function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function stripEm(text?: string): string | undefined {
  return text ? text.replace(/<\/?em>/g, "") : text;
}

function dedupeCap(items: GlobalSearchItem[]): GlobalSearchItem[] {
  const seen = new Set<string>();
  const result: GlobalSearchItem[] = [];
  for (const item of items) {
    if (!item.id || !item.title || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
    if (result.length >= MAX_ITEMS_PER_PLATFORM) break;
  }
  return result;
}

function extractItems(platformId: Platform, raw: any): GlobalSearchItem[] {
  switch (platformId) {
    case "pinedrama":
      return dedupeCap(
        asArray(raw).map((d: any) => ({
          id: String(d.collection_id ?? ""),
          title: stripEm(d.title) || "",
          cover: d.cover,
          href: `/detail/pinedrama/${d.collection_id}`,
          description: d.description,
          tags: (d.tags || []).map((t: string) => stripEm(t) || t),
        }))
      );
    case "dramabox":
      return dedupeCap(
        asArray(raw).map((d: any) => ({
          id: String(d.bookId ?? ""),
          title: d.bookName || "",
          cover: d.cover,
          href: `/detail/dramabox/${d.bookId}`,
          description: d.introduction,
          tags: d.tagNames || [],
        }))
      );
    case "reelshort":
      return dedupeCap(
        asArray(raw).map((b: any) => ({
          id: String(b.book_id ?? ""),
          title: b.book_title || "",
          cover: b.book_pic,
          href: `/detail/reelshort/${b.book_id}`,
          description: b.special_desc,
          tags: b.theme || [],
        }))
      );
    case "shortmax":
      return dedupeCap(
        asArray(raw).map((d: any) => ({
          id: String(d.shortPlayId ?? ""),
          title: d.title || "",
          cover: d.cover,
          href: `/detail/shortmax/${d.shortPlayId}`,
          tags: d.genre || [],
        }))
      );
    case "goodshort":
      return dedupeCap(
        asArray(raw).map((b: any) => ({
          id: String(b.bookId ?? ""),
          title: b.bookName || "",
          cover: b.cover,
          href: `/detail/goodshort/${b.bookId}`,
          description: b.introduction,
          tags: b.labels || [],
        }))
      );
    case "netshort":
      return dedupeCap(
        asArray(raw).map((d: any) => ({
          id: String(d.shortPlayId ?? ""),
          title: d.title || "",
          cover: d.cover,
          href: `/detail/netshort/${d.shortPlayId}`,
          description: d.description,
          tags: d.labels || [],
        }))
      );
    case "melolo": {
      const books =
        raw?.data?.search_data?.flatMap((item: any) => item.books || []) || [];
      return dedupeCap(
        books
          .filter((b: any) => b.thumb_url && b.thumb_url !== "")
          .map((b: any) => ({
            id: String(b.book_id ?? ""),
            title: b.book_name || "",
            cover: b.thumb_url,
            href: `/detail/melolo/${b.book_id}`,
            description: b.abstract,
            tags: (b.stat_infos || []).slice(0, 1),
          }))
      );
    }
    case "freereels":
      return dedupeCap(
        asArray(raw).map((b: any) => ({
          id: String(b.key ?? ""),
          title: b.title || "",
          cover: b.cover,
          href: `/detail/freereels/${b.key}`,
          description: b.desc,
          tags: b.content_tags || [],
        }))
      );
    case "flickreels":
      return dedupeCap(
        asArray(raw).map((d: any) => ({
          id: String(d.playletId ?? ""),
          title: d.title || "",
          cover: d.cover,
          href: `/detail/flickreels/${d.playletId}`,
          description: d.description,
          tags: d.tags || [],
        }))
      );
    default:
      return [];
  }
}

export function Header() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  // Chip yang sedang aktif/terpilih di deretan chip pencarian. Selalu dimulai
  // dari platform yang sedang dipilih saat ini (disinkronkan lewat effect di
  // bawah); mengklik chip platform lain memindahkan pilihan ke chip itu.
  const [selectedChip, setSelectedChip] = useState<Platform>("melolo");
  // Platform yang sudah diminta dicari untuk query saat ini (model klik-chip).
  // Platform aktif selalu termasuk; sisanya masuk hanya lewat klik chip.
  const [activatedPlatforms, setActivatedPlatforms] = useState<Platform[]>([]);

  const debouncedQuery = useDebounce(searchQuery, 400);
  const fastQuery = debouncedQuery.trim();

  // Platform context
  const { currentPlatform, platformInfo, platforms, setPlatform } = usePlatform();

  const effectiveActivated: Platform[] = Array.from(
    new Set<Platform>([currentPlatform, ...activatedPlatforms])
  );

  const queryFor = (id: Platform): string => {
    if (!effectiveActivated.includes(id)) return "";
    return fastQuery.length >= MIN_QUERY_LENGTH ? fastQuery : "";
  };

  // Model klik-chip: hook platform yang belum diaktifkan menerima query kosong
  // (nonaktif), jadi tidak ada request sama sekali untuk platform itu.
  const pine = usePineDramaSearch(queryFor("pinedrama"));
  const dbox = useSearchDramas(queryFor("dramabox"));
  const reel = useReelShortSearch(queryFor("reelshort"));
  const smax = useShortMaxSearch(queryFor("shortmax"));
  const gshort = useGoodShortSearch(queryFor("goodshort"));
  const nshort = useNetShortSearch(queryFor("netshort"));
  const melolo = useMeloloSearch(queryFor("melolo"));
  const freereels = useFreeReelsSearch(queryFor("freereels"));
  const flick = useFlickReelsSearch(queryFor("flickreels"));

  const hookByPlatform: Partial<Record<Platform, { data: any; isLoading: boolean; isError: boolean }>> = {
    pinedrama: pine,
    dramabox: dbox,
    reelshort: reel,
    shortmax: smax,
    goodshort: gshort,
    netshort: nshort,
    melolo: melolo,
    freereels: freereels,
    flickreels: flick,
  };

  const groups: GlobalSearchGroup[] = platforms.map((p) => {
    const hook = hookByPlatform[p.id];
    return {
      platform: p,
      items: hook?.data ? extractItems(p.id, hook.data) : [],
      isLoading: !!hook?.isLoading,
      isError: !!hook?.isError,
    };
  });

  // Platform aktif selalu tampil paling atas.
  const orderedGroups = [
    ...groups.filter((g) => g.platform.id === currentPlatform),
    ...groups.filter((g) => g.platform.id !== currentPlatform),
  ];

  const searching = fastQuery.length >= MIN_QUERY_LENGTH;
  // Hasil yang ditampilkan hanya milik chip terpilih (satu platform).
  const selectedGroup = groups.find((g) => g.platform.id === selectedChip);
  const anyLoading = !!selectedGroup?.isLoading;
  const anyError = !!selectedGroup?.isError;
  const totalResults = selectedGroup?.items.length ?? 0;
  const visibleGroups = selectedGroup ? [selectedGroup] : [];
  const groupsWithResults = visibleGroups.filter((g) => g.items.length > 0);

  // Chip aktif selalu mengikuti platform yang sedang dipilih saat pencarian
  // dibuka atau platform berganti.
  useEffect(() => {
    if (searchOpen) {
      setSelectedChip(currentPlatform);
    }
  }, [searchOpen, currentPlatform]);

  // Setiap query berubah: chip aktif kembali ke platform yang sedang dipilih
  // dan aktivasi platform lain direset (belum dicari untuk kata yang baru).
  useEffect(() => {
    setSelectedChip(currentPlatform);
    setActivatedPlatforms([]);
  }, [fastQuery, currentPlatform]);

  const activatePlatform = (id: Platform) => {
    setActivatedPlatforms((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSelectedChip(id);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleResultClick = (groupPlatform: Platform) => {
    // Samakan platform aktif dengan asal hasil agar konteks jelajah konsisten.
    if (groupPlatform !== currentPlatform) {
      setPlatform(groupPlatform);
    }
    handleSearchClose();
  };

  // Hide header on watch pages for immersive video experience
  if (pathname?.startsWith("/watch")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              DramaMalku
            </span>
          </Link>

          {/* Search Button Only - No Nav Links */}
          <div className="flex items-center gap-2">
            {/* Platform Selector Button */}
            <button
              onClick={() => setPlatformModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted/80 transition-colors border border-border/50"
            >
              <div className="relative w-5 h-5 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={platformInfo.logo}
                  alt={platformInfo.name}
                  fill
                  className="object-cover"
                  sizes="20px"
                />
              </div>
              <span className="font-medium text-xs sm:text-sm text-foreground whitespace-nowrap">
                {platformInfo.name}
              </span>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay (Portal) */}
      {searchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-background z-[9999] overflow-hidden">
            <div className="container mx-auto px-4 py-6 h-[100dvh] flex flex-col">
              <div className="flex items-center gap-4 mb-6 flex-shrink-0">
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari drama di semua platform..."
                    className="search-input pl-12"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearchClose}
                  className="p-3 rounded-xl hover:bg-muted/50 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chip platform (model klik-chip): chip aktif mengikuti
                  platform yang sedang dipilih. Platform yang belum dicari
                  tampil polos — mengkliknya BARU menjalankan pencarian di
                  platform itu sekaligus memindahkan chip aktif ke sana. */}
              {searching && (
                <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
                  {orderedGroups.map((g) => {
                    const isActivated = effectiveActivated.includes(g.platform.id);
                    return (
                      <button
                        key={g.platform.id}
                        onClick={() =>
                          isActivated
                            ? setSelectedChip(g.platform.id)
                            : activatePlatform(g.platform.id)
                        }
                        title={
                          isActivated
                            ? `Tampilkan hasil ${g.platform.name}`
                            : `Cari juga di ${g.platform.name}`
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                          selectedChip === g.platform.id
                            ? "bg-primary/20 text-primary"
                            : isActivated
                              ? "bg-muted/50 text-muted-foreground hover:bg-muted"
                              : "bg-transparent border border-dashed border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {g.platform.name}
                        {isActivated &&
                          (g.isLoading ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>· {g.items.length}</span>
                          ))}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search Results */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                {!searching && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {fastQuery.length > 0
                        ? `Ketik minimal ${MIN_QUERY_LENGTH} huruf untuk mulai mencari`
                        : `Ketik untuk mencari di ${platformInfo.name} — klik chip platform lain untuk mencari di platform tersebut`}
                    </p>
                  </div>
                )}

                {searching && totalResults === 0 && anyLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Mencari di {selectedGroup?.platform.name ?? platformInfo.name}…
                    </p>
                  </div>
                )}

                {searching && groupsWithResults.length > 0 && (
                  <div className="space-y-8 pb-8">
                    {groupsWithResults.map((group) => (
                      <section key={group.platform.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="relative w-5 h-5 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={group.platform.logo}
                              alt={group.platform.name}
                              fill
                              className="object-cover"
                              sizes="20px"
                            />
                          </div>
                          <h3 className="font-display font-semibold text-foreground">
                            {group.platform.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {group.items.length} hasil
                          </span>
                          {group.isLoading && (
                            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                        <div className="grid gap-3">
                          {group.items.map((item, index) => (
                            <Link
                              key={`${group.platform.id}-${item.id}`}
                              href={item.href}
                              onClick={() => handleResultClick(group.platform.id)}
                              className="flex gap-4 p-4 rounded-2xl bg-card hover:bg-muted transition-all text-left animate-fade-up overflow-hidden"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="w-16 h-24 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
                                {item.cover ? (
                                  <Image
                                    src={optimizeThumb(item.cover)}
                                    alt={item.title}
                                    width={128}
                                    height={192}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <span className="text-xs text-muted-foreground">No Img</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-display font-semibold text-foreground truncate">
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                    {item.description}
                                  </p>
                                )}
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {item.tags.slice(0, 3).map((tag, idx) => (
                                      <span key={idx} className="tag-pill text-[10px]">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))}

                    {anyLoading && (
                      <p className="text-center text-xs text-muted-foreground">
                        Masih mencari…
                      </p>
                    )}
                    {!anyLoading && anyError && (
                      <p className="text-center text-xs text-muted-foreground">
                        Platform ini sempat tidak merespons, hasil mungkin tidak lengkap.
                      </p>
                    )}
                  </div>
                )}

                {searching && totalResults === 0 && !anyLoading && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Tidak ada hasil untuk "{fastQuery}" di{" "}
                      {selectedGroup?.platform.name ?? platformInfo.name}
                      {anyError ? " — platform sedang tidak merespons" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Klik chip platform lain di atas untuk mencari di platform
                      tersebut.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* Platform Selector Modal (Portal) */}
      {platformModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setPlatformModalOpen(false)}>
            <div
              className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[80vh] overflow-y-auto animate-fade-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
                <h2 className="font-display font-bold text-lg text-foreground">Pilih Platform</h2>
                <button
                  onClick={() => setPlatformModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform Grid */}
              <div className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => {
                        setPlatform(platform.id);
                        setPlatformModalOpen(false);
                      }}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                        ${platformInfo.id === platform.id
                          ? "bg-primary/15 ring-2 ring-primary shadow-md"
                          : "hover:bg-muted/50"
                        }
                      `}
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm bg-muted/30">
                        <Image
                          src={platform.logo}
                          alt={platform.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight line-clamp-1 ${
                        platformInfo.id === platform.id ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer — current platform */}
              <div className="p-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{platforms.length} platform tersedia</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-5 h-5 rounded-md overflow-hidden">
                    <Image
                      src={platformInfo.logo}
                      alt={platformInfo.name}
                      fill
                      className="object-cover"
                      sizes="20px"
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{platformInfo.name}</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
