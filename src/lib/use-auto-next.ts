"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hitung mundur "episode berikutnya" yang bisa dibatalkan — menggantikan
 * lompatan otomatis seketika saat video berakhir di halaman watch.
 * onAdvance dipanggil saat hitung mundur selesai atau pengguna menekan
 * "Putar Sekarang". Referensi onAdvance selalu yang terbaru dari halaman.
 */
export function useAutoNext(onAdvance: () => void, seconds = 5) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);
  const advanceRef = useRef(onAdvance);
  advanceRef.current = onAdvance;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    remainingRef.current = 0;
    setCountdown(null);
  }, []);

  const playNow = useCallback(() => {
    cancel();
    advanceRef.current();
  }, [cancel]);

  const start = useCallback(() => {
    cancel();
    remainingRef.current = seconds;
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      remainingRef.current -= 1;
      if (remainingRef.current <= 0) {
        cancel();
        advanceRef.current();
      } else {
        setCountdown(remainingRef.current);
      }
    }, 1000);
  }, [cancel, seconds]);

  useEffect(() => cancel(), [cancel]);

  return { countdown, start, cancel, playNow };
}
