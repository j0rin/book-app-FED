import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router';
import BookCover from '../components/BookCover';
import BookRating from '../components/BookRating';

// subjects filteren zodat alleen bruikbare categorieen overblijven
function filterValidSubjects(subjects = []) {
  return subjects.filter((subject) => {
    const lower = subject.toLowerCase();

    return (
      subject.length < 30 &&
      !lower.includes('open library') &&
      !lower.includes('series:') &&
      !lower.includes('edition') &&
      !lower.includes('translated') &&
      !lower.includes('translations') &&
      !lower.includes('accessible') &&
      !lower.includes('internet archive') &&
      !lower.includes('reading level') &&
      !lower.includes('readers')
    );
  });
}

// ratings van het huidige boek ophalen
async function fetchRating(id) {
  const response = await fetch(`https://openlibrary.org/works/${id}/ratings.json`);

  // null teruggeven als de request mislukt
  if (!response.ok) {
    return null;
  }

  return response.json();
}

// vergelijkbare boeken ophalen op basis van subjects
async function fetchSimilarBooks(id, subjects) {
  // eerste 10 relevante subjects gebruiken voor recommendations
  const recommendationSubjects = subjects.slice(0, 10);

  // lege array teruggeven als er geen subjects beschikbaar zijn
  if (recommendationSubjects.length === 0) {
    return [];
  }

  // voor elk subject boeken ophalen
  const results = await Promise.all(
    recommendationSubjects.map((subject) =>
      fetch(`https://openlibrary.org/search.json?subject=${encodeURIComponent(subject)}&limit=10`).then((res) =>
        res.json()
      )
    )
  );

  // alle resultaten samenvoegen
  const combinedBooks = results.flatMap((result) => result.docs || []);

  // dubbele boeken verwijderen op basis van work key
  const uniqueBooks = Array.from(new Map(combinedBooks.map((item) => [item.key, item])).values());

  // huidige boek verwijderen en alleen bruikbare resultaten behouden
  return uniqueBooks
    .filter((item) => item.key !== `/works/${id}`)
    .filter((item) => item.cover_i)
    .filter((item) => item.title)
    .sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0))
    .slice(0, 10);
}

export default function BookDetails() {
  // useParams haalt de dynamische route parameter uit de url
  const { id } = useParams();

  // states voor boekdata, rating, loading, error, read more toggle en similar books
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loadingSimilarBooks, setLoadingSimilarBooks] = useState(true);

  // useEffect draait zodra de component mount of wanneer id verandert
  // hierdoor wordt nieuwe data opgehaald als gebruiker naar ander boek navigeert
  useEffect(() => {
    async function fetchBook() {
      // states resetten wanneer er een nieuw boek geladen wordt
      setLoadingBook(true);
      setLoadingSimilarBooks(true);
      setRating(null);
      setError(null);

      try {
        // hoofdinformatie van het boek ophalen
        const response = await fetch(`https://openlibrary.org/works/${id}.json`);

        // controleren of de API een succesvolle response teruggeeft
        if (!response.ok) {
          throw new Error('This book does not exist');
        }

        const data = await response.json();
        setBook(data);

        // ratings ophalen
        const ratingData = await fetchRating(id);
        setRating(ratingData);

        // relevante subjects filteren
        const validSubjects = filterValidSubjects(data.subjects || []);

        // vergelijkbare boeken ophalen
        const similarBooksData = await fetchSimilarBooks(id, validSubjects);
        setSimilarBooks(similarBooksData);
      } catch (error) {
        // foutmelding tonen in de UI als er iets misgaat
        console.error(error);
        setError(error.message);
        setBook(null);
        setSimilarBooks([]);
      } finally {
        // loading states altijd uitzetten
        setLoadingBook(false);
        setLoadingSimilarBooks(false);
      }
    }

    fetchBook();
  }, [id]);

  // description alleen bepalen als book bestaat
  const description = book?.description?.value || book?.description || 'No description available';

  // description opdelen in woorden zodat deze vervolgens geteld kunnen worden
  const words = description.split(' ');

  // eerste 50 woorden tonen als preview
  const previewDescription = words.slice(0, 50).join(' ');

  // toon korte preview of volledige tekst
  const displayedDescription = showFullDescription
    ? description
    : `${previewDescription}${words.length > 50 ? '...' : ''}`;

  // eerste 5 relevante subjects tonen als tags
  const visibleSubjects = filterValidSubjects(book?.subjects || []).slice(0, 5);

  return (
    <div className="corner-smooth min-h-100 w-full max-w-140 overflow-clip rounded-[calc(var(--radius-4xl)+1px)] border border-taupe-300 bg-white shadow-2xl shadow-taupe-950/10">
      <div className="sticky top-0 border-b border-taupe-100 bg-white px-6 pb-6">
        <Link to="/" className="inline-flex flex-col">
          <span className="bg-taupe-700 p-4 text-sm text-taupe-50">Close book</span>

          <span className="h-3 bg-taupe-700 [clip-path:polygon(0_0,100%_0%,100%_100%,50%_0,0_100%)]"></span>
        </Link>
      </div>

      <div className="flex flex-col gap-6 border-b border-taupe-100 p-6">
        {loadingBook ? (
          <p>Loading book...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            <BookCover
              cover={book.covers?.[0] ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg` : null}
              title={book.title}
              className="corner-smooth max-w-60 rounded-xl"
            />

            <h1 className="text-4xl text-balance">{book.title}</h1>

            <BookRating rating={rating} />

            <div className="flex flex-col gap-2 text-sm leading-6">
              <ReactMarkdown>{displayedDescription}</ReactMarkdown>

              {words.length > 50 && (
                <button
                  onClick={() => setShowFullDescription((prev) => !prev)}
                  className="w-fit cursor-pointer text-taupe-500"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {visibleSubjects.map((subject) => (
                <Link key={subject} to={`/?q=${encodeURIComponent(subject)}`} className="tag capitalize">
                  {subject}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6 p-6">
        <h2 className="text-3xl">Similar Books</h2>

        {error ? (
          <p>No books found</p>
        ) : loadingSimilarBooks ? (
          <p>Loading more books...</p>
        ) : similarBooks.length > 0 ? (
          <div className="-m-2 flex flex-col gap-2">
            {similarBooks.map((similar) => (
              <Link
                key={similar.key}
                to={`/book/${similar.key.split('/').pop()}`}
                className="corner-smooth flex items-center gap-4 rounded-2xl p-2 hover:bg-taupe-100 focus:bg-taupe-100 focus:outline-none"
              >
                <BookCover
                  cover={similar.cover_i ? `https://covers.openlibrary.org/b/id/${similar.cover_i}-M.jpg` : null}
                  title={similar.title}
                  className="corner-smooth w-12 shrink-0 rounded-md"
                />
                <div className="min-w-0">
                  <p className="truncate">{book.title}</p>

                  <p className="mt-1 truncate text-sm text-taupe-400">
                    {similar.author_name?.join(', ') || 'Unknown Author'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>No books found</p>
        )}
      </div>
    </div>
  );
}
