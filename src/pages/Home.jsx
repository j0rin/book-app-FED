import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
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
  // hook om query params uit de url te lezen en aan te passen
  // hierdoor blijft de zoekopdracht bewaard in de url
  const [searchParams, setSearchParams] = useSearchParams();

  // state voor inputveld, resultaten en loading state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  // kiest eenmalig 10 random subjects bij het laden van de pagina
  // useMemo zorgt ervoor dat deze niet bij elke render opnieuw shufflet
  const randomSubjects = useMemo(() => {
    return [...SUBJECTS].sort(() => Math.random() - 0.5).slice(0, 10);
  }, []);

  // wacht 400ms na typen voordat api call wordt gedaan
  // dit voorkomt te veel requests tijdens het typen
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const trimmedQuery = query.trim();

      // als input leeg is resultaten resetten
      if (!trimmedQuery) {
        setBooks([]);
        setSearchParams({});
        return;
      }

      // zoekterm synchroniseren met de url
      // handig voor refresh, browser history en deelbare links
      setSearchParams({ q: trimmedQuery });

      setLoading(true);

      try {
        // api call naar open library service
        const results = await searchBooks(trimmedQuery);

        // resultaten opslaan in state zodat component opnieuw rendert
        setBooks(results);
      } catch (error) {
        console.error(error);
      } finally {
        // loading state altijd resetten
        setLoading(false);
      }
    }, 400);

    // cleanup function voorkomt dat oude timeouts blijven lopen
    return () => clearTimeout(timeout);
  }, [query, setSearchParams]);

  // useEffect draait bij eerste load
  // leest query uit url
  useEffect(() => {
    const urlQuery = searchParams.get('q');

    if (!urlQuery) return;

    setQuery(urlQuery);
  }, []);

  return (
    <>
      <div className="header">
        <h1 className="text-4xl text-balance">What would you like to read?</h1>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, authors, genres..."
          className="mt-8 w-full rounded-md bg-taupe-200 px-6 py-4"
        />

        <p className="mt-2 text-sm leading-6">
          Type in a book, series, or topic you enjoyed to discover what to read next.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {randomSubjects.map((subject) => (
            <button key={subject} onClick={() => setQuery(subject)} className="tag cursor-pointer">
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="main">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bookcase">
            {books.map((book) => {
              const info = book;

              return (
                <Link to={`/book/${book.key.split('/').pop()}`} key={book.key}>
                  <BookCover cover={`https://covers.openlibrary.org/b/id/${info.cover_i}-M.jpg`} title={info.title} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
