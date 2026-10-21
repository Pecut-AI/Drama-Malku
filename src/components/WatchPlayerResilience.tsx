"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Loader2, RotateCcw, X } from "lucide-react";

const MAX_AUTO_RETRY = 3;
const BACKOFF_MS = [2000, 5000, 10000];
const STALL_LIMIT_MS = 9000;

type Status =
  | { kind: "recovering"; attempt: number }
  | { kind: "failed" }
  | null;

/**
 * Ketahanan pemutar — dipasang sekali di layout watch, generik semua platform.
 * Saat stream gagal/terputus (upstream fluktuatif):
 * - Pemutar sumber langsung (URL http): muat ulang otomatis maks 3x dengan
 *   jeda bertingkat, posisi putar dikembalikan ke titik gagal.
 * - Pemutar MSE/HLS (URL blob): TIDAK diutak-atik (hls.js punya pemulihan
 *   sendiri) — hanya tampilkan status; bila macet berkepanjangan, tawarkan
 *   muat ulang halaman (posisi dilanjutkan perekam Lanjut Menonton).
 * - Selama pemutaran normal kembali, semua status dibersihkan.
 */
export function WatchPlayerResilience() {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>(null);
  const [dismissed, setDismissed] = useState(false);
  const reloadRef = useRef<() => void>(() => {});

  useEffect(() => {
    setDismissed(false);
  }, [pathname]);

  useEffect(() => {
    if (!pathname || !pathname.startsWith("/watch/")) return;

    let video: HTMLVideoElement | null = null;
    let disposed = false;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let escalationTimer: ReturnType<typeof setTimeout> | null = null;
    let retryArmedAt = 0;
    let lastAdvanceAt = Date.now();
    let lastTime = 0;
    let stallSince: number | null = null;

    const clearRetry = () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const clearEscalation = () => {
      if (escalationTimer) {
        clearTimeout(escalationTimer);
        escalationTimer = null;
      }
    };

    const isDirectSource = () =>
      !!video && /^https?:/i.test(video.currentSrc || "");

    const doRetry = () => {
      if (!video || disposed) return;
      const pos = video.currentTime || 0;
      const restore = () => {
        if (!video) return;
        if (pos > 1 && Math.abs(video.currentTime - pos) > 1) {
          try {
            video.currentTime = pos;
          } catch {
            // abaikan
          }
        }
        video.removeEventListener("loadedmetadata", restore);
      };
      video.addEventListener("loadedmetadata", restore);
      try {
        video.load();
      } catch {
        // abaikan
      }
      video.play().catch(() => {
        // autoplay bisa ditolak; pengguna dapat menekan play manual
      });
      retryArmedAt = Date.now();
      // Eskalasi: bila 7 detik setelah retry video tetap tidak berputar,
      // perlakukan sebagai kegagalan berikutnya (tanpa ini, error yang
      // datang cepat setelah load() tertelan jeda pengaman dan retry
      // berhenti di percobaan 1 selamanya).
      clearEscalation();
      escalationTimer = setTimeout(() => {
        if (disposed || !video) return;
        if (!video.paused && video.readyState >= 3) return;
        if (video.readyState >= 3 && video.currentTime > 0) return;
        retryArmedAt = 0;
        handleFailure();
      }, 7000);
    };

    const handleFailure = () => {
      if (disposed || !video) return;
      if (document.visibilityState !== "visible") return;
      // Jeda singkat setelah load() agar error ganda untuk sumber yang
      // sama tidak terhitung dua kali; retry yang sudah terjadwal juga
      // tidak perlu digandakan.
      if (Date.now() - retryArmedAt < 1200) return;
      if (retryTimer) return;

      if (!isDirectSource()) {
        // MSE/HLS: jangan ganggu pemulihan internal hls.js; tampilkan status
        // dan eskalasi ke "gagal" hanya bila macet lama (watchdog yang menilai).
        if (!stallSince) stallSince = Date.now();
        if (Date.now() - stallSince > 20000) {
          setStatus({ kind: "failed" });
        } else {
          setStatus({ kind: "recovering", attempt: 0 });
        }
        return;
      }

      if (attempts >= MAX_AUTO_RETRY) {
        setStatus({ kind: "failed" });
        return;
      }
      attempts += 1;
      setStatus({ kind: "recovering", attempt: attempts });
      clearRetry();
      retryTimer = setTimeout(doRetry, BACKOFF_MS[attempts - 1] ?? 5000);
    };

    const onError = () => {
      if (!video) return;
      if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        handleFailure();
      }
    };

    const onPlaying = () => {
      attempts = 0;
      stallSince = null;
      lastAdvanceAt = Date.now();
      clearRetry();
      clearEscalation();
      setStatus(null);
    };

    const onTimeUpdate = () => {
      if (!video) return;
      if (Math.abs(video.currentTime - lastTime) > 0.2) {
        lastTime = video.currentTime;
        lastAdvanceAt = Date.now();
        if (stallSince && video.readyState >= 3) stallSince = null;
      }
    };

    const watchdog = window.setInterval(() => {
      if (disposed || !video) return;
      if (video.paused || video.ended || document.visibilityState !== "visible") return;
      if (video.readyState >= 3) return;
      if (Date.now() - lastAdvanceAt > STALL_LIMIT_MS) {
        handleFailure();
        lastAdvanceAt = Date.now();
      }
    }, 2000);

    const attach = (v: HTMLVideoElement) => {
      video = v;
      lastTime = v.currentTime || 0;
      lastAdvanceAt = Date.now();
      v.addEventListener("error", onError);
      v.addEventListener("playing", onPlaying);
      v.addEventListener("timeupdate", onTimeUpdate);
    };

    const detach = () => {
      if (!video) return;
      video.removeEventListener("error", onError);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video = null;
    };

    // Halaman watch mengganti episode tanpa memuat ulang halaman; elemen
    // video bisa berganti — periksa berkala dan ikat ulang bila berubah.
    const poll = window.setInterval(() => {
      if (disposed) return;
      const v = document.querySelector("video");
      if (v && v !== video) {
        detach();
        attach(v);
      }
    }, 1000);

    // Sebagian halaman (mis. Melolo) tidak merender elemen <video> sama
    // sekali bila sumber gagal didapat — hanya teks "Video unavailable"
    // tanpa jalan keluar. Bila setelah 25 detik tetap tidak ada video,
    // tampilkan kartu gagal dengan tombol muat ulang halaman. (Ambang
    // dilonggarkan dari 15 detik: pemuatan data DramaBox yang lambat
    // terbukti bisa melewati 15 detik lalu berhasil berputar.)
    const noVideoTimer = window.setTimeout(() => {
      if (disposed) return;
      if (!video && !document.querySelector("video")) {
        setStatus((s) => s ?? { kind: "failed" });
      }
    }, 25000);

    reloadRef.current = () => {
      attempts = 0;
      stallSince = null;
      setStatus(null);
      if (video && isDirectSource()) {
        retryArmedAt = 0;
        doRetry();
      } else {
        window.location.reload();
      }
    };

    return () => {
      disposed = true;
      window.clearInterval(poll);
      window.clearTimeout(noVideoTimer);
      window.clearInterval(watchdog);
      clearRetry();
      clearEscalation();
      detach();
      setStatus(null);
    };
  }, [pathname]);

  if (!status || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-[90] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-black/85 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-2xl max-w-md">
        {status.kind === "recovering" ? (
          <>
            <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
            <p className="text-white text-xs md:text-sm">
              Sumber video terputus — mencoba memuat ulang
              {status.attempt > 0 ? ` (percobaan ${status.attempt}/${MAX_AUTO_RETRY})` : ""}…
            </p>
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-white text-xs md:text-sm flex-1">
              Video belum bisa dimuat — sumbernya sedang bermasalah.
            </p>
            <button
              onClick={() => reloadRef.current()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Coba Lagi
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Tutup pemberitahuan"
              className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
