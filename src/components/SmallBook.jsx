export default function SmallBook({ cover, title, className = '' }) {
  return (
    <div className={`aspect-2/3 overflow-hidden rounded-sm bg-taupe-200 ${className}`}>
      {cover ? (
        <img src={cover} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-taupe-600">No Cover Available</div>
      )}
    </div>
  );
}
