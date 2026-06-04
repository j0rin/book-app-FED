import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router';
import BookCover from '../components/BookCover';

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
    .slice(0, 20);
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
    <>
      <div className="header">
        <Link to="/" className="mb-8 inline-block rounded-full bg-taupe-700 px-4 py-2 text-sm text-taupe-50">
          Close book
        </Link>

        {loadingBook ? (
          <p>Loading book...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            <BookCover
              cover={book.covers?.[0] ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg` : null}
              title={book.title}
              className="mt-8 max-w-xs"
            />

            <div className="mt-8">
              <h1 className="text-4xl">{book.title}</h1>

              {rating?.summary?.count > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-taupe-50 px-2">
                  <span className="text-lg text-amber-500">
                    {'★'.repeat(Math.round(rating.summary.average))}
                    {'☆'.repeat(5 - Math.round(rating.summary.average))}
                  </span>

                  <span className="text-sm font-bold text-taupe-600">{rating.summary.average.toFixed(1)}</span>

                  <span className="text-sm text-taupe-600">{rating.summary.count} reviews</span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 text-sm leading-6">
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

              <div className="mt-6 flex flex-wrap gap-2">
                {visibleSubjects.map((subject) => (
                  <Link key={subject} to={`/?q=${encodeURIComponent(subject)}`} className="tag capitalize">
                    {subject}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="main">
        <h2 className="mb-8 text-3xl">Similar Books</h2>

        {error ? (
          <p>No books found</p>
        ) : loadingSimilarBooks ? (
          <p>Loading...</p>
        ) : similarBooks.length > 0 ? (
          <div className="bookcase">
            {similarBooks.map((similar) => (
              <Link key={similar.key} to={`/book/${similar.key.split('/').pop()}`}>
                <BookCover
                  cover={`https://covers.openlibrary.org/b/id/${similar.cover_i}-L.jpg`}
                  title={similar.title}
                />
              </Link>
            ))}
          </div>
        ) : (
          <p>No books found</p>
        )}
      </div>
    </>
  );
}
