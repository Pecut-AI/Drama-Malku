"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, LayoutGrid } from "lucide-react";

/**
 * Menu navigasi bawah (23 Okt 2026): Beranda, Daftar Saya,
 * Genre. Disembunyikan di halaman watch agar tidak menutupi pemutar.
 */
const ITEMS = [
  { href: "/", label: "Beranda", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/daftar-saya",
    label: "Daftar Saya",
    icon: Bookmark,
    match: (p: string) => p.startsWith("/daftar-saya"),
  },
  {
    href: "/genre",
    label: "Genre",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/genre"),
  },
];

export function BottomNav() {
  const pathname = usePathname() || "/";
  if (pathname.startsWith("/watch")) return null;

  return (
    <>
      {/* Spacer agar konten tidak tertutup bar tetap di bawah. */}
      <div className="h-16" aria-hidden="true" />
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-md border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-3">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
