// Upstream: dramaletto.com — daftar genre global (untuk halaman Genre).
import { encryptedResponse } from "@/lib/api-utils";
import { dlGenres } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const genres = await dlGenres();
    return encryptedResponse({ success: true, data: genres });
  } catch (error) {
    console.error("DL genres error:", error);
    return encryptedResponse(
      { success: false, error: "Gagal memuat genre", data: [] },
      500
    );
  }
}
