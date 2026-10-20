import { NextRequest, NextResponse } from "next/server";
import { encryptedResponse, fetchWithRetry } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sansekai.my.id/api"}/freereels/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add any necessary headers here
      },
      next: { revalidate: 60 } // Cache pencarian identik 60 detik (Evolusi P1, hemat kuota upstream)
    });

    if (!res.ok) {
      throw new Error(`Upstream API failed with status ${res.status}`);
    }

    const data = await res.json();
    return await encryptedResponse(data);
  } catch (error) {
    console.error("Error fetching FreeReels search:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
