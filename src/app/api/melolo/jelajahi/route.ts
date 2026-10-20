import { type NextRequest } from "next/server";
import { encryptedResponse, safeJson, fetchWithRetry } from "@/lib/api-utils";
import { JELAJAHI_KEYWORD_POOL } from "@/lib/jelajahi";

export const dynamic = "force-dynamic";

/**
 * GET /api/melolo/jelajahi?keyword=<kata>
 *
 * Satu kata kunci per panggilan, khusus untuk seksi Jelajahi. Berbeda dari
 * /api/melolo/search (untuk pencarian pengguna, cache 60 detik), route ini
 * memakai cache server 1 jam per kata kunci karena tujuannya panen berkala:
 * setelah kata kunci pertama kali dipanen, seluruh pengunjung selama 1 jam
 * dilayani dari cache tanpa request baru ke API Sansekai.
 *
 * Kata kunci dibatasi whitelist JELAJAHI_KEYWORD_POOL agar route ini tidak
 * menjadi proksi pencarian bebas.
 */
export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim();

  if (!keyword) {
    return encryptedResponse({ error: "Keyword parameter is required" }, 400);
  }

  const allowed = JELAJAHI_KEYWORD_POOL.some(
    (k) => k.toLowerCase() === keyword.toLowerCase()
  );
  if (!allowed) {
    return encryptedResponse({ error: "Keyword not allowed" }, 400);
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api";
    const response = await fetchWithRetry(
      `${baseUrl}/melolo/search?query=${encodeURIComponent(keyword)}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return encryptedResponse({ error: "Failed to harvest keyword" }, response.status);
    }

    const data = await safeJson<any>(response);
    return encryptedResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return encryptedResponse({ error: message }, 500);
  }
}
