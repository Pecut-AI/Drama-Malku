// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { NextRequest } from "next/server";
import { encryptedResponse } from "@/lib/api-utils";
import { dlBrowse } from "@/lib/dramaletto";
import { gsRankPayload } from "@/lib/goodshort-shape";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const items = await dlBrowse("goodshort", page);
    const hasMore = (items || []).length > 0;
    return encryptedResponse(
      gsRankPayload("Untuk Kamu", items || [], page, hasMore ? page + 1 : page)
    );
  } catch (error) {
    console.error("GoodShort ForYou (dramaletto) Error:", error);
    return encryptedResponse(
      { status: 500, message: "Failed to fetch from GoodShort", data: null },
      500
    );
  }
}
