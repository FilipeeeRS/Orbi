// Esqueleto genérico enquanto a página carrega (o cabeçalho continua visível).
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-surface-2" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-surface-2" />
          <div className="h-3 w-24 rounded bg-surface-2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="aspect-[2/3] rounded-md bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
