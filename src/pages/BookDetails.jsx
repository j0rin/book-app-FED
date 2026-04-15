import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useParams } from 'react-router';
import SmallBook from '../components/SmallBook';

export default function BookDetails() {
  // useParams haalt de dynamische route parameter uit de url
  const { id } = useParams();

  // states voor boekdata, rating, read more toggle en similar books
  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loadingSimilarBooks, setLoadingSimilarBooks] = useState(true);

  // useEffect draait zodra de component mount of wanneer id verandert
  // hierdoor wordt nieuwe data opgehaald als gebruiker naar ander boek navigeert
  useEffect(() => {
    async function fetchBook() {
      // loading resetten zodat gebruiker feedback krijgt
      setLoadingSimilarBooks(true);

      // hoofdinformatie van het boek ophalen
      const response = await fetch(`https://openlibrary.org/works/${id}.json`);
      const data = await response.json();

      // response opslaan in state zodat component opnieuw rendert
      setBook(data);

      // ratings ophalen
      const ratingResponse = await fetch(`https://openlibrary.org/works/${id}/ratings.json`);

      // checken of de response succesvol is
      if (ratingResponse.ok) {
        const ratingData = await ratingResponse.json();
        setRating(ratingData);
      }

      // eerste subject gebruiken als basis voor recommendations
      // --------------------------------------------------------------------------------------------------------- verbeteren
      const firstSubject = data.subjects?.[0];

      if (firstSubject) {
        const similarResponse = await fetch(
          `https://openlibrary.org/search.json?subject=${encodeURIComponent(firstSubject)}&limit=12`
        );

        const similarData = await similarResponse.json();

        // huidige boek uit resultaten filteren zodat deze niet dubbel getoond wordt
        setSimilarBooks((similarData.docs || []).filter((item) => item.key !== `/works/${id}`));
      } else {
        // fallback als boek geen subjects heeft
        setSimilarBooks([]);
      }

      setLoadingSimilarBooks(false);
    }

    fetchBook();
  }, [id]);

  // zolang boekdata nog niet geladen is tonen we loading state
  if (!book) {
    return <p className="p-6">Loading...</p>;
  }

  // description normaliseren omdat api soms string en soms object terugstuurt
  const description = book.description?.value || book.description || 'No description available';

  // description opdelen in woorden zodat deze vervolgens geteld kunnen worden
  const words = description.split(' ');

  // eerste 50 woorden tonen als preview
  const previewDescription = words.slice(0, 50).join(' ');

  // toon korte preview of volledige tekst
  const displayedDescription = showFullDescription
    ? description
    : `${previewDescription}${words.length > 50 ? '...' : ''}`;

  return (
    <>
      <div className="header">
        <Link to="/" className="inline-block rounded-full bg-taupe-700 px-4 py-2 text-sm text-taupe-50">
          Close book
        </Link>

        <SmallBook
          cover={`https://covers.openlibrary.org/b/id/${book.covers?.[0]}-L.jpg`}
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
            {book.subjects?.slice(0, 5).length &&
              book.subjects.slice(0, 5).map((subject) => (
                <Link key={subject} to={`/?q=${encodeURIComponent(subject)}`} className="tag capitalize">
                  {subject}
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="main">
        <h2 className="mb-8 text-3xl">Similar Books</h2>

        {loadingSimilarBooks ? (
          <p>Loading...</p>
        ) : similarBooks.length > 0 ? (
          <div className="bookcase">
            {similarBooks.map((similar) => (
              <Link key={similar.key} to={`/book/${similar.key.split('/').pop()}`}>
                <SmallBook
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
