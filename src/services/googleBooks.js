const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function searchBooks(query) {
  const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=20&key=${API_KEY}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}
