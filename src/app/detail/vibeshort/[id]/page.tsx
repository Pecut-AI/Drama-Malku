import { redirect } from "next/navigation";

// Platform VibeShort sudah tidak tersedia di DramaMalku (kembali ke API Sansekai,
// 30 Okt 2026) — URL lama dialihkan ke beranda.
export default function VibeShortDetailPage() {
  redirect("/");
}
