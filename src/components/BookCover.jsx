export default function BookCover({ cover, title, className = '' }) {
  return (
    <div className={`aspect-2/3 overflow-hidden bg-taupe-200 ${className}`}>
      {cover ? (
        <img src={cover} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-center text-sm text-taupe-600">No cover</div>
      )}
    </div>
  );
}
