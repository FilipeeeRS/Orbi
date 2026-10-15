// Nota em meias estrelas: 1 = ½★ ... 10 = 5★

export function StarsDisplay({
  rating,
  className = "",
  valueLang,
}: {
  rating: number | null;
  className?: string;
  // Idioma para mostrar a nota em número ao lado (ex.: "3,5"); sem ele, só as estrelas.
  valueLang?: string;
}) {
  if (!rating) return null;
  const full = Math.floor(rating / 2);
  return (
    <span className={`whitespace-nowrap text-star ${className}`} aria-label={`${rating / 2}/5`}>
      {"★".repeat(full)}
      {rating % 2 ? "½" : ""}
      {valueLang && <span className="ms-1 text-muted">{(rating / 2).toLocaleString(valueLang)}</span>}
    </span>
  );
}

export function StarIcon({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <svg viewBox="0 0 24 24" className="size-full">
      <defs>
        <clipPath id="half-star">
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"
        className="fill-surface-2 stroke-border"
        strokeWidth="1"
      />
      {fill > 0 && (
        <path
          d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"
          className="fill-star"
          clipPath={fill === 0.5 ? "url(#half-star)" : undefined}
        />
      )}
    </svg>
  );
}
