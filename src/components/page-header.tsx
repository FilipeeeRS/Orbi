import Link from "next/link";
import { BackButton } from "./back-button";

// Cabeçalho padrão das telas de listagem e de conta: ← seta de voltar, ícone, título, contagem em cinza
// e, à direita na mesma linha, filtros ou ações. Uma linha embaixo separa do conteúdo.
export function PageHeader({
  title,
  back,
  icon,
  count,
  extra,
  children,
  border = true,
}: {
  title: React.ReactNode;
  back?: string; // para onde a seta vai quando não há tela anterior (link de fora, aba nova)
  icon?: React.ReactNode;
  count?: React.ReactNode;
  extra?: React.ReactNode; // ao lado do título (ex.: o filtro vindo da ficha de um jogo)
  children?: React.ReactNode; // à direita: filtros, ações
  border?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-3 gap-y-1 ${border ? "border-b border-border" : ""}`}>
      <h1 className="font-display flex min-w-0 items-center gap-2 pb-2 text-2xl font-extrabold">
        {back && <BackButton fallback={back} />}
        {icon}
        <span className="min-w-0">{title}</span>
        {extra}
        {count != null && <span className="font-sans text-sm font-normal text-muted">{count}</span>}
      </h1>
      {children}
    </div>
  );
}

// Abas de uma tela (Home, pastas do perfil, busca, notificações): texto com ícone opcional e contagem,
// sublinhado na aba aberta. Sem `bordered`, quem chama já desenha a linha embaixo (ex.: com filtros ao lado).
export function TabNav({
  tabs,
  bordered = true,
}: {
  tabs: { key: string; href: string; label: React.ReactNode; active: boolean; icon?: React.ReactNode; count?: number }[];
  bordered?: boolean;
}) {
  const nav = (
    <nav className="-mb-px flex gap-5 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          scroll={false}
          aria-current={tab.active ? "page" : undefined}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-2 text-sm font-semibold whitespace-nowrap transition ${
            tab.active ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count != null && <span className="text-xs font-normal opacity-70">{tab.count}</span>}
        </Link>
      ))}
    </nav>
  );
  // A aba aberta fica por cima da linha de baixo (-mb-px)
  return bordered ? <div className="border-b border-border">{nav}</div> : nav;
}

// Lista vazia: caixa tracejada com o aviso (e, se tiver, uma ação embaixo).
export function EmptyState({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
      <p>{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
