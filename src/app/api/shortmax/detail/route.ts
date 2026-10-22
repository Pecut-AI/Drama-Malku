// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { dlTitle } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const shortPlayId = request.nextUrl.searchParams.get("shortPlayId");
    if (!shortPlayId) {
      return encryptedResponse({ success: false, error: "shortPlayId is required" }, 400);
    }
    const data = await dlTitle("shortmax", shortPlayId);
    return encryptedResponse({
      success: true,
      shortPlayId: parseInt(data.id, 10) || 0,
      shortPlayCode: parseInt(data.id, 10) || 0,
      title: data.title,
      cover: data.cover,
      description: data.synopsis || "",
      labels: data.tags || [],
      totalEpisodes: data.totalEpisodes,
      updateEpisode: data.totalEpisodes,
      lockBegin: 0,
      collectNum: 0,
    });
  } catch (error) {
    console.error("ShortMax Detail (dramaletto) Error:", error);
    return encryptedResponse({ success: false, error: "Internal server error" });
  }
}
