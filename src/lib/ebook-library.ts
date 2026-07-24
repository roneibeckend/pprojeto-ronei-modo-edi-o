// Local library of AI-generated ebooks published for sale.
// Persisted in localStorage while the API is not integrated.

export type LibraryEbook = {
  id: string;
  title: string;
  description: string;
  cover: string;
  pages: number;
  price: number;
  originalPrice?: number;
  category: string;
  publishedAt: string;
};

const KEY = "eiv:library";

export function loadLibrary(): LibraryEbook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LibraryEbook[]) : [];
  } catch {
    return [];
  }
}

export function saveLibrary(items: LibraryEbook[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToLibrary(item: LibraryEbook) {
  const items = loadLibrary().filter((e) => e.id !== item.id);
  items.unshift(item);
  saveLibrary(items);
}

export function removeFromLibrary(id: string) {
  saveLibrary(loadLibrary().filter((e) => e.id !== id));
}

export function isInLibrary(id: string): boolean {
  return loadLibrary().some((e) => e.id === id);
}
