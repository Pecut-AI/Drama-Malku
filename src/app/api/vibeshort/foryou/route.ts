import { NextResponse, type NextRequest } from "next/server";

// Platform vibeshort sudah tidak tersedia di DramaMalku (kembali ke API Sansekai,
// 30 Okt 2026) — endpoint lama dialihkan ke beranda.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}
