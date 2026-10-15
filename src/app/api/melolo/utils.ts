export function extractMeloloBooks(data: any): any[] {
  if (!data) return [];
  const books: any[] = [];

  // Structure 1: data.cells (array) -> cell_data -> books
  if (Array.isArray(data.cells)) {
    data.cells.forEach((cell: any) => {
      if (Array.isArray(cell?.cell_data)) {
        cell.cell_data.forEach((section: any) => {
          if (Array.isArray(section?.books)) {
            books.push(...section.books);
          }
        });
      }
    });
  }

  // Structure 2: data.cell (object) -> cell_data -> books
  if (data.cell && Array.isArray(data.cell.cell_data)) {
    data.cell.cell_data.forEach((section: any) => {
      if (Array.isArray(section?.books)) {
        books.push(...section.books);
      }
    });
  }

  // Structure 3: direct data.books (array)
  if (Array.isArray(data.books)) {
    books.push(...data.books);
  }

  // Deduplicate books by book_id
  const seen = new Set<string>();
  return books.filter((b) => {
    if (!b || !b.book_id) return false;
    if (seen.has(b.book_id)) return false;
    seen.add(b.book_id);
    return true;
  });
}
