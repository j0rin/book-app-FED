// src/components/BookRating.jsx
import ImageStarEmpty from '../icons/star-empty.svg?react';
import ImageStarFilled from '../icons/star-filled.svg?react';

export default function BookRating({ rating }) {
  if (!rating?.summary?.count) {
    return <p className="text-sm text-taupe-600">No ratings yet</p>;
  }

  const roundedRating = Math.round(rating.summary.average);

  return (
    <div className="flex items-center gap-2 text-sm text-taupe-600">
      <span className="flex gap-0.5 text-amber-500">
        {[...Array(5)].map((_, index) =>
          index < roundedRating ? (
            <ImageStarFilled key={index} width={16} height={16} />
          ) : (
            <ImageStarEmpty key={index} width={16} height={16} />
          )
        )}
      </span>

      <span className="font-bold">{rating.summary.average.toFixed(1)}</span>

      <span>{rating.summary.count} reviews</span>
    </div>
  );
}
