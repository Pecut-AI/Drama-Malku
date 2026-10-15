# Panduan Deploy DramaMalku

DramaMalku adalah fork dari SekaiDrama (https://github.com/Sansekai/SekaiDrama, lisensi MIT).
Perubahan pada fork ini: nama situs diganti menjadi DramaMalku, dan popup donasi QRIS dimatikan.
Sudah terverifikasi: `npm ci` bersih, `npm run build` sukses, server produksi merespons HTTP 200
dengan judul "DramaMalku - Streaming Drama Pendek".

## Yang dibutuhkan sebelum deploy

Buat file `.env` (salin dari `.env.example`) berisi:

- `NEXT_PUBLIC_API_BASE_URL` — alamat API Sansekai (sudah terisi di `.env.example`).
- `NEXT_PUBLIC_CRYPTO_SECRET` — kunci rahasia bebas karanganmu sendiri (dipakai enkripsi di sisi browser).

Di Vercel, kedua variabel ini diisi lewat menu Project → Settings → Environment Variables
(jangan upload file `.env` ke mana pun).

## Cara 1 — Vercel (disarankan, gratis)

1. Buat akun di vercel.com (bisa login pakai GitHub).
2. Upload kode ini ke repo GitHub milikmu sendiri (buat repo baru, push semua file zip ini), ATAU
   pakai Vercel CLI dari komputer: `npm i -g vercel` lalu `vercel` di folder proyek.
3. Di Vercel: "Add New Project" → pilih repo → framework akan terdeteksi sebagai Next.js → isi
   Environment Variables di atas → Deploy.
4. Selesai: kamu dapat alamat `nama-proyek.vercel.app`. Domain sendiri bisa dipasang belakangan
   di Settings → Domains.

## Cara 2 — Komputer/server sendiri (Node.js 18+)

```bash
npm ci
cp .env.example .env   # lalu isi NEXT_PUBLIC_CRYPTO_SECRET dengan karanganmu
npm run build
npm run start          # jalan di http://localhost:3000
```

Agar online dari internet, server ini perlu IP publik/domain (VPS) atau tunnel —
untuk pemakaian pribadi, Cara 1 jauh lebih praktis.

## Catatan

- Data & video tetap berasal dari API Sansekai; situs ini hanya mengganti tampilan & nama.
  API tersebut punya batas request (dokumentasinya menyebut ±10 request/menit untuk jalur demo),
  jadi sesekali halaman bisa lambat/gagal memuat saat sumbernya sibuk — itu dari sumbernya.
- Beberapa platform di dalam aplikasi (mis. DramaNova) mengikuti struktur repo asli.
- File `LICENSE` wajib tetap disertakan (syarat lisensi MIT).
