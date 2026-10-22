// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { dlBrowse } from "@/lib/dramaletto";
import { gsRankPayload } from "@/lib/goodshort-shape";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await dlBrowse("goodshort", 1);
    return encryptedResponse(gsRankPayload("Terbaru", items || []));
  } catch (error) {
    console.error("GoodShort Latest (dramaletto) Error:", error);
    return encryptedResponse(
      { status: 500, message: "Failed to fetch from GoodShort", data: null },
      500
    );
  }
}
