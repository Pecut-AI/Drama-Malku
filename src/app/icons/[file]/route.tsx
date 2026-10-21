import { ImageResponse } from "next/og";

/**
 * Ikon PWA dihasilkan sebagai PNG asli oleh route ini (bukan file biner di
 * repo): gradasi ungu→fuchsia→pink + segitiga play putih, mengikuti
 * favicon.svg. Ukuran & varian dipilih dari nama file.
 */
const SIZES: Record<string, { size: number; maskable?: boolean }> = {
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "icon-maskable-512.png": { size: 512, maskable: true },
  "apple-touch-icon.png": { size: 180 },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((file) => ({ file }));
}

export const dynamicParams = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const cfg = SIZES[file];
  if (!cfg) return new Response("Not found", { status: 404 });

  const { size, maskable } = cfg;
  const triSize = Math.round(size * (maskable ? 0.52 : 0.62));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #9333ea 0%, #c026d3 50%, #e11d63 100%)",
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        <svg width={triSize} height={triSize} viewBox="0 0 100 100">
          <polygon
            points="36,26 36,74 74,50"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="11"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
