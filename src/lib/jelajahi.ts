/**
 * Jelajahi Melolo — konfigurasi panen kata kunci (Evolusi lanjutan, 20 Okt 2026).
 *
 * Latar: feed Melolo dari API Sansekai kecil (Sedang Hangat 10, Rilis Baru 10,
 * Lainnya hanya 8 judul unik). Katalog yang lebih besar hanya terjangkau lewat
 * endpoint pencarian (10 hasil per kata kunci). Fitur Jelajahi memanen pencarian
 * dengan kata kunci bertema, menggabungkan + men-dedup hasilnya, dan melayani
 * sisanya dari cache — sesuai evaluasi 4 model Geraikita (20 Okt 2026):
 * panen bertahap dengan jeda, kata kunci dirotasi, urutan stabil per siklus,
 * dan selalu ada fallback hasil parsial bila sebagian panen gagal.
 *
 * Mekanisme hemat request:
 * - Per siklus 1 jam hanya SUBSET kata kunci yang dipanen (bukan seluruh pool).
 * - Tiap kata kunci di-cache server 1 jam (lihat route /api/melolo/jelajahi),
 *   jadi total request ke API untuk fitur ini maksimal sejumlah subset per jam,
 *   dibagi ke semua pengunjung.
 * - Rotasi subset per jam membuat seluruh pool terjelajahi dalam beberapa jam
 *   tanpa menambah beban per siklus.
 */
export const JELAJAHI_KEYWORD_POOL: string[] = [
  "cinta",
  "CEO",
  "presiden",
  "istri",
  "suami",
  "rahasia",
  "nikah",
  "bos",
  "kaya",
  "desa",
  "balas dendam",
  "warisan",
  "kontrak",
  "pelakor",
  "perjodohan",
  "reinkarnasi",
  "sekretaris",
  "pengkhianatan",
];

/** Jumlah kata kunci yang dipanen per siklus 1 jam. */
export const JELAJAHI_SUBSET_SIZE = 5;

/** Lama satu siklus rotasi (1 jam, milidetik). */
export const JELAJAHI_CYCLE_MS = 60 * 60 * 1000;

/**
 * Kata kunci untuk siklus yang sedang berjalan.
 * Deterministik berdasarkan jam: semua pengunjung pada jam yang sama mendapat
 * subset yang sama, dan subset bergeser pada jam berikutnya.
 */
export function getJelajahiCycleKeywords(now: number = Date.now()): string[] {
  const pool = JELAJAHI_KEYWORD_POOL;
  const slot = Math.floor(now / JELAJAHI_CYCLE_MS);
  const start = (slot * JELAJAHI_SUBSET_SIZE) % pool.length;
  const result: string[] = [];
  for (let i = 0; i < JELAJAHI_SUBSET_SIZE; i++) {
    result.push(pool[(start + i) % pool.length]);
  }
  return result;
}

/** Nomor siklus saat ini — dipakai sebagai bagian queryKey agar cache klien ikut berotasi tiap jam. */
export function getJelajahiCycleSlot(now: number = Date.now()): number {
  return Math.floor(now / JELAJAHI_CYCLE_MS);
}
