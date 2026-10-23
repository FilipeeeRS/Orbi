import { SectionHeading } from "./section";

// Esqueletos de carregamento: blocos cinza pulsando no formato do que vai aparecer,
// para a página não "pular" quando o conteúdo chega.

const block = "animate-pulse rounded-md bg-surface-2";

// Fileira de pôsteres (Home, recomendações, buscas).
export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${i >= 3 ? "hidden sm:block" : ""}`}>
          <div className={`${block} aspect-[2/3]`} />
          <div className={`${block} mt-2 h-3 w-3/4`} />
        </div>
      ))}
    </div>
  );
}

// Grade de pôsteres (Ver tudo, pastas do perfil).
export function GridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className={`${block} aspect-[2/3]`} />
          <div className={`${block} mt-2 h-3 w-3/4`} />
        </div>
      ))}
    </div>
  );
}

// Seção de linhas (reviews, notificações): o título, se vier, já aparece; o conteúdo pulsa.
export function SectionSkeleton({ title, rows = 3 }: { title?: string; rows?: number }) {
  return (
    <section aria-busy="true">
      {title && <SectionHeading>{title}</SectionHeading>}
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex gap-3">
            <div className={`${block} size-9 shrink-0 rounded-full`} />
            <div className="flex-1 space-y-2 pt-1">
              <div className={`${block} h-3 w-40`} />
              <div className={`${block} h-3 w-full max-w-md`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Página de uma obra: fundo, título, texto, editor e pôster no lugar certo.
export function ItemSkeleton() {
  return (
    <div className="mx-auto max-w-[58rem] space-y-10" aria-busy="true" role="status">
      <div className="relative -mt-6 ml-[calc(50%-min(50vw,650px))] h-70 w-[min(100vw,1300px)] bg-surface sm:-mt-8 sm:h-120" />
      <div className="relative -mt-24 grid grid-cols-[minmax(0,1fr)] items-start gap-8 sm:-mt-40 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-5">
          <div className={`${block} h-9 w-2/3`} />
          <div className={`${block} h-4 w-1/3`} />
          <div className="space-y-2">
            <div className={`${block} h-3 w-full`} />
            <div className={`${block} h-3 w-full`} />
            <div className={`${block} h-3 w-4/5`} />
          </div>
          <div className={`${block} h-16 w-full rounded-xl`} />
        </div>
        <div className="order-first mx-auto w-40 sm:order-none sm:w-full">
          <div className={`${block} aspect-[2/3] shadow-2xl`} />
        </div>
      </div>
    </div>
  );
}
