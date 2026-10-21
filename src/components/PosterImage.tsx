"use client";

import { useState } from "react";
import Image from "next/image";
import { optimizeCover } from "@/lib/image-utils";

interface PosterImageProps {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Poster tahan gagal: bila gambar dari CDN platform gagal dimuat (atau URL
 * kosong), tampilkan placeholder lokal — gradasi warna yang diturunkan dari
 * judul + huruf awal judul — supaya kartu/rak/banner tidak pernah terlihat
 * rusak. Menggantikan <Image fill> secara langsung (induk harus relative).
 */
export function PosterImage({ src, alt, sizes, priority, className }: PosterImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    let hash = 0;
    const label = alt || "";
    for (let i = 0; i < label.length; i++) {
      hash = (hash * 31 + label.charCodeAt(i)) % 360;
    }
    const initial = label.trim().charAt(0).toUpperCase() || "?";
    return (
      <div
        aria-label={alt}
        role="img"
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: `linear-gradient(150deg, hsl(${hash} 62% 40%) 0%, hsl(${(hash + 55) % 360} 68% 26%) 100%)`,
        }}
      >
        <span className="font-display font-extrabold text-white/85 text-4xl md:text-5xl drop-shadow-lg select-none">
          {initial}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={optimizeCover(src)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
