// Pembentuk respons menyerupai bentuk asli GoodShort (records[].items[])
// dari data dramaletto — komponen frontend GoodShort membaca bentuk itu.
import type { DlItem } from "@/lib/dramaletto";

export function gsItem(item: DlItem) {
  return {
    bookId: item.id,
    bookName: item.title,
    cover: item.cover || item.poster,
    chapterCount: item.totalEpisodes || 0,
    introduction: "",
    typeTwoNames: item.tags || [],
    labels: item.tags || [],
    viewCount: 0,
    viewCountDisplay: "",
    ratings: 0,
    firstChapterId: 1,
  };
}

export function gsRankPayload(name: string, items: DlItem[], page = 1, pages = 1) {
  const mapped = items.map(gsItem);
  return {
    data: {
      current: page,
      size: mapped.length,
      total: mapped.length,
      pages,
      records: [{ channelId: 0, columnId: 0, name, style: "", items: mapped }],
    },
    status: 200,
    message: "success",
    success: true,
    timestamp: Date.now(),
  };
}
