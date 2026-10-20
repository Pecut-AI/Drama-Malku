"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getWatchSession } from "@/lib/watch-session";
import {
  getContinueWatching,
  upsertContinueWatching,
} from "@/lib/continue-watching";

/**
 * Perekam Lanjut Menonton — dipasang sekali di layout watch, berlaku untuk
 * semua platform. Cara kerja generik (tidak menyentuh halaman watch mana pun):
 * 1. Baca token watch dari URL (segmen terakhir atau ?t=), petakan ke sesi
 *    {platform, bookId, episode} lewat getWatchSession.
 * 2. Temukan elemen <video> di halaman, dengarkan timeupdate/pause:
 *    simpan posisi terakhir (di-throttle) ke localStorage.
 * 3. Saat video siap (loadedmetadata), lompat ke posisi tersimpan bila
 *    episodenya sama — inilah yang membuat "lanjut" benar-benar melanjutkan.
 */
export function ContinueWatchingRecorder() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !pathname.startsWith("/watch/")) return;

    const search = new URLSearchParams(window.location.search);
    const segments = pathname.split("/").filter(Boolean);
    const token = search.get("t") || segments[segments.length - 1] || "";
    const session = token ? getWatchSession(token) : null;
    if (!session) return;

    let video: HTMLVideoElement | null = null;
    let seekDone = false;
    let lastSave = 0;
    let disposed = false;

    const sameEpisode = (entry: ReturnType<typeof getContinueWatching>[number]) => {
      if (entry.episodeId && session.episodeId) return entry.episodeId === session.episodeId;
      if (entry.episodeNumber != null && session.episodeNumber != null)
        return entry.episodeNumber === session.episodeNumber;
      if (entry.episodeIndex != null && session.episodeIndex != null)
        return entry.episodeIndex === session.episodeIndex;
      return true;
    };

    const save = () => {
      if (!video || !isFinite(video.duration) || video.duration <= 0) return;
      // Jangan simpan posisi yang belum berarti (baru mulai < 3 detik)
      if (video.currentTime < 3 && video.duration - video.currentTime > 15) return;
      upsertContinueWatching({
        platform: session.platform,
        dramaId: session.bookId,
        episodeId: session.episodeId,
        episodeNumber: session.episodeNumber,
        episodeIndex: session.episodeIndex,
        positionSec: Math.floor(video.currentTime),
        durationSec: Math.floor(video.duration),
      });
    };

    const trySeek = () => {
      if (!video || seekDone) return;
      const entry = getContinueWatching().find(
        (e) => e.platform === session.platform && e.dramaId === session.bookId
      );
      if (!entry || !sameEpisode(entry)) {
        seekDone = true;
        return;
      }
      const pos = entry.positionSec || 0;
      const dur = entry.durationSec || video.duration || 0;
      // Lanjutkan hanya bila posisi cukup jauh dari awal & belum hampir tamat
      if (pos > 10 && dur > 0 && pos < dur - 15 && Math.abs(video.currentTime - pos) > 2) {
        try {
          video.currentTime = pos;
        } catch {
          // abaikan
        }
      }
      seekDone = true;
    };

    const onTimeUpdate = () => {
      const now = Date.now();
      if (now - lastSave >= 4000) {
        lastSave = now;
        save();
      }
    };
    const onPause = () => save();
    const onLoaded = () => trySeek();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };

    const attach = (v: HTMLVideoElement) => {
      video = v;
      v.addEventListener("timeupdate", onTimeUpdate);
      v.addEventListener("pause", onPause);
      v.addEventListener("loadedmetadata", onLoaded);
      document.addEventListener("visibilitychange", onVisibility);
      if (v.readyState >= 1) trySeek();
    };

    // Elemen video mungkin belum ter-render saat effect jalan — tunggu sebentar.
    const poll = window.setInterval(() => {
      if (disposed) return;
      const v = document.querySelector("video");
      if (v) {
        window.clearInterval(poll);
        attach(v);
      }
    }, 500);
    const pollTimeout = window.setTimeout(() => window.clearInterval(poll), 20000);

    return () => {
      disposed = true;
      window.clearInterval(poll);
      window.clearTimeout(pollTimeout);
      if (video) {
        save();
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("loadedmetadata", onLoaded);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
