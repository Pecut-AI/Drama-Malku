import { NextResponse } from "next/server";
import { encryptData } from "@/lib/crypto";

export async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text || !text.trim()) {
    throw new Error(`Empty response from upstream: ${response.url}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    console.error("Raw Text (truncated):", text.substring(0, 200));
    throw new Error("Invalid JSON response from upstream");
  }
}

export function encryptedResponse(data: any, status = 200) {
  const encrypted = encryptData(data);
  return NextResponse.json({ success: true, data: encrypted }, { status });
}

/**
 * fetchWithRetry — fetch ke upstream dengan perlindungan berlapis (Evolusi P1, 20 Okt 2026):
 * 1. Retry otomatis untuk status sementara (403/429/5xx) dan error jaringan,
 *    dengan jeda backoff bertingkat (400ms, lalu 1200ms).
 * 2. Fallback data basi: respons sukses terakhir per URL disimpan di memori
 *    (maks 200 entri, maks 2MB per entri). Jika semua percobaan gagal dan ada
 *    salinan basi, salinan itu yang dikembalikan dengan header
 *    "x-dramamalku-stale: 1" agar halaman tetap tampil daripada error kosong.
 * Cache utama tetap dari opsi `next: { revalidate }` di tiap pemanggilan
 * (Next Data Cache), fallback memori ini hanya jaring pengaman terakhir dan
 * sifatnya per-instance (di serverless bisa reset, itu wajar).
 */
type FetchInitWithNext = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

const staleStore = new Map<string, { body: string; storedAt: number }>();
const STALE_MAX_ENTRIES = 200;
const STALE_MAX_BODY = 2 * 1024 * 1024;

function rememberStale(url: string, body: string) {
  if (body.length > STALE_MAX_BODY) return;
  if (staleStore.size >= STALE_MAX_ENTRIES && !staleStore.has(url)) {
    const oldest = staleStore.keys().next().value;
    if (oldest) staleStore.delete(oldest);
  }
  staleStore.set(url, { body, storedAt: Date.now() });
}

function staleResponse(url: string): Response | null {
  const hit = staleStore.get(url);
  if (!hit) return null;
  return new Response(hit.body, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-dramamalku-stale": "1",
    },
  });
}

export async function fetchWithRetry(
  url: string | URL,
  init?: FetchInitWithNext,
  retries = 2
): Promise<Response> {
  const key = url.toString();
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt === 1 ? 400 : 1200));
    }
    try {
      const response = await fetch(url, init);
      const retryable =
        response.status === 403 ||
        response.status === 429 ||
        response.status >= 500;

      if (retryable && attempt < retries) {
        // Buang body agar koneksi bebas, lalu coba lagi.
        try {
          await response.text();
        } catch {
          /* abaikan */
        }
        continue;
      }

      if (response.ok) {
        // Simpan salinan untuk fallback basi, kembalikan respons baru dari salinan itu
        // karena body Response hanya bisa dibaca sekali.
        const text = await response.clone().text();
        rememberStale(key, text);
        return new Response(text, {
          status: response.status,
          headers: response.headers,
        });
      }

      // Status gagal yang tidak bisa di-retry lagi: coba fallback basi.
      if (retryable) {
        const stale = staleResponse(key);
        if (stale) return stale;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        const stale = staleResponse(key);
        if (stale) return stale;
        throw error;
      }
    }
  }

  const stale = staleResponse(key);
  if (stale) return stale;
  throw lastError instanceof Error ? lastError : new Error("fetchWithRetry failed");
}
