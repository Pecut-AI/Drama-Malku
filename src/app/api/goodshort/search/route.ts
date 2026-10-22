// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { dlSearch } from "@/lib/dramaletto";
import { gsItem } from "@/lib/goodshort-shape";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    if (!query) {
      return encryptedResponse({
        data: { searchResult: { records: [] } },
        status: 200,
        message: "success",
        success: true,
      });
    }
    const items = await dlSearch("goodshort", query);
    return encryptedResponse({
      data: { searchResult: { records: (items || []).map(gsItem) } },
      status: 200,
      message: "success",
      success: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("GoodShort Search (dramaletto) Error:", error);
    return encryptedResponse(
      { status: 500, message: "Failed to fetch search from GoodShort", data: null },
      500
    );
  }
}
