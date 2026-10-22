// Upstream: dramaletto.com (sejak 23 Okt 2026, menggantikan api.sansekai.my.id).
import { encryptedResponse } from "@/lib/api-utils";
import { dlTitle } from "@/lib/dramaletto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");
    if (!bookId) {
      return encryptedResponse({ status: 400, message: "bookId is required", data: null }, 400);
    }
    const data = await dlTitle("goodshort", bookId);
    return encryptedResponse({
      data: {
        book: {
          bookId: data.id,
          bookName: data.title,
          cover: data.cover,
          chapterCount: data.totalEpisodes,
          introduction: data.synopsis || "",
          labels: data.tags || [],
        },
      },
      status: 200,
      message: "success",
      success: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("GoodShort Detail (dramaletto) Error:", error);
    return encryptedResponse(
      { status: 500, message: "Failed to fetch detail from GoodShort", data: null },
      500
    );
  }
}
