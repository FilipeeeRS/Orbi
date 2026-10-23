import Link from "next/link";

// Título de seção padrão do site (Home, página da obra, perfil, busca, listas): letras pequenas em
// caixa alta, cinza, com uma linha embaixo; à direita, "Ver tudo" (link) ou um número.
export function SectionHeading({
  children,
  more,
  count,
}: {
  children: React.ReactNode;
  more?: { href: string; label: string };
  count?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-2">
      <h2 className="text-xs font-semibold tracking-widest text-muted uppercase">
        {children}
        {count != null && <span className="ms-1.5 font-normal tracking-normal tabular-nums">{count}</span>}
      </h2>
      {more && (
        <Link href={more.href} className="shrink-0 text-[11px] tracking-wider text-muted uppercase hover:text-accent">
          {more.label}
        </Link>
      )}
    </div>
  );
}

export function Section({
  title,
  more,
  count,
  id,
  children,
}: {
  title: React.ReactNode;
  more?: { href: string; label: string };
  count?: React.ReactNode;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={id ? "scroll-mt-24" : undefined}>
      <SectionHeading more={more} count={count}>
        {title}
      </SectionHeading>
      {children}
    </section>
  );
}
