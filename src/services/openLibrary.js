const BASE_URL = 'https://openlibrary.org/search.json';

export async function searchBooks(query) {
  const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&limit=20`);

  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }

  const data = await response.json();
  return data.docs || [];
}
