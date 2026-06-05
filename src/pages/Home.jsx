import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import BookCover from '../components/BookCover';
import { searchBooks } from '../services/openLibrary';

const SUBJECTS = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Thriller',
  'Historical Fiction',
  'Young Adult',
  'Adventure',
  'Horror',
  'Biography',
  'Classics',
  'Self Help',
  'Philosophy',
  'Poetry',
  'Dystopian',
  'Magic',
  'Crime',
  'Space',
  'Dragons',
  'Friendship',
];

export default function Home() {
  // states voor zoekterm, resultaten, loading, foutmeldingen en zoekstatus
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const showSubjects = !loading && !error && books.length === 0 && !hasSearched;

  // kiest eenmalig 10 random subjects bij het laden van de pagina
  // useMemo zorgt ervoor dat deze niet bij elke render opnieuw shufflet
  const randomSubjects = useMemo(() => {
    return [...SUBJECTS].sort(() => Math.random() - 0.5).slice(0, 12);
  }, []);

  // wacht 400ms na typen voordat api call wordt gedaan
  // dit voorkomt te veel requests tijdens het typen
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const trimmedQuery = query.trim();

      // als input leeg is resultaten resetten
      if (!trimmedQuery) {
        setBooks([]);
        setError(null);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // boeken ophalen
        const results = await searchBooks(trimmedQuery);

        setBooks(results);
        setHasSearched(true);
      } catch (error) {
        console.error(error);

        setBooks([]);
        setError('Books could not be loaded');
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400);

    // cleanup function voorkomt dat oude timeouts blijven lopen
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="flex w-full max-w-140 flex-col items-center gap-12">
      <h1 className="max-w-[14ch] text-center text-5xl">What would you like to read?</h1>

      <div className="corner-smooth flex h-100 w-full flex-col overflow-clip rounded-[calc(var(--radius-4xl)+1px)] border border-taupe-300 bg-white shadow-2xl shadow-taupe-950/10 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange-500">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, authors..."
          className="border-b border-taupe-100 px-6 py-4 text-xl font-light text-inherit placeholder-taupe-400 focus:outline-none"
        />

        <div className="scrollbar-hide flex grow items-center justify-center overflow-y-auto">
          {showSubjects && (
            <div className="flex flex-wrap justify-center gap-2 p-12">
              {randomSubjects.map((subject) => (
                <button key={subject} onClick={() => setQuery(subject)} className="tag cursor-pointer">
                  {subject}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : books.length > 0 ? (
            <div className="flex w-full flex-col gap-2 self-start p-4">
              {books.map((book) => (
                <Link
                  to={`/book/${book.key.split('/').pop()}`}
                  key={book.key}
                  className="corner-smooth flex items-center gap-4 rounded-2xl p-2 hover:bg-taupe-100 focus:bg-taupe-100 focus:outline-none"
                >
                  <BookCover
                    cover={book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null}
                    title={book.title}
                    className="corner-smooth w-12 shrink-0 rounded-md"
                  />
                  <div className="min-w-0">
                    <p className="truncate">{book.title}</p>

                    <p className="mt-1 truncate text-sm text-taupe-400">
                      {book.author_name?.join(', ') || 'Unknown Author'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : hasSearched ? (
            <p>No books found</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
