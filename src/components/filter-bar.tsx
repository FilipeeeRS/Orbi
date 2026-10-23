"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// group: tópico do menu ("Lançamento" → "Mais novos primeiro"); sem group, a opção fica solta.
type Option = { value: string; label: string; group?: string };

export type FilterBarProps = {
  labels: {
    decade: string;
    genre: string;
    rating: string;
    sortBy: string;
    any: string;
    noRating: string;
    search: string;
    clear: string;
    folder?: string;
  };
  decades: Option[];
  genres: Option[];
  ratings: Option[];
  sorts: Option[];
  folders?: Option[]; // aba Listas: listas com obras de uma pasta (filmes, séries...)
  defaultSort: string;
  // Parâmetro da URL usado pela lupa. Na busca é outro ("in"), para não substituir o termo pesquisado.
  searchParam?: string;
};

// Barra de filtros das pastas, no estilo do Letterboxd: menus que abrem ao passar o mouse
// (ou ao clicar, no celular) e uma lupa para filtrar pelo título. Tudo fica na URL.
export function FilterBar({ labels, decades, genres, ratings, sorts, folders, defaultSort, searchParam = "q" }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(!!params.get(searchParam));
  const [q, setQ] = useState(params.get(searchParam) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "sort" && value === defaultSort) next.delete("sort");
    next.delete("page"); // filtro novo volta para a página 1
    router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function onSearch(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => update(searchParam, value.trim() || null), 350);
  }

  const active = ["decade", "genre", "rating", "folder", searchParam].some((k) => params.get(k));

  function clear() {
    const next = new URLSearchParams(params.toString());
    for (const k of ["decade", "genre", "rating", "folder", searchParam, "page"]) next.delete(k);
    setQ("");
    setSearchOpen(false);
    router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 pb-2 text-xs">
      {active && (
        <button type="button" onClick={clear} className="me-1 rounded px-2 py-1 text-accent hover:underline">
          {labels.clear}
        </button>
      )}
      {decades.length > 0 && (
        <Dropdown label={labels.decade} anyLabel={labels.any} options={decades} value={params.get("decade")} onChange={(v) => update("decade", v)} />
      )}
      {genres.length > 0 && (
        <Dropdown label={labels.genre} anyLabel={labels.any} options={genres} value={params.get("genre")} onChange={(v) => update("genre", v)} />
      )}
      {ratings.length > 0 && (
        <Dropdown label={labels.rating} anyLabel={labels.any} options={ratings} value={params.get("rating")} onChange={(v) => update("rating", v)} />
      )}
      {folders && folders.length > 0 && (
        <Dropdown label={labels.folder ?? ""} anyLabel={labels.any} options={folders} value={params.get("folder")} onChange={(v) => update("folder", v)} />
      )}
      <Dropdown
        label={labels.sortBy}
        options={sorts}
        value={params.get("sort") ?? defaultSort}
        onChange={(v) => update("sort", v)}
        showValue
      />
      <div className="flex items-center">
        {searchOpen && (
          <input
            autoFocus
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setSearchOpen(false), onSearch(""))}
            placeholder={labels.search}
            className="w-40 rounded-md border border-border bg-bg px-2 py-1 text-xs outline-none focus:border-accent sm:w-52"
          />
        )}
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label={labels.search}
          className={`grid size-7 place-items-center rounded-md transition hover:bg-surface-2 hover:text-fg ${
            searchOpen || q ? "text-fg" : "text-muted"
          }`}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Dropdown({
  label,
  anyLabel,
  options,
  value,
  onChange,
  showValue,
}: {
  label: string;
  anyLabel?: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  showValue?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const pick = (v: string | null) => {
    setOpen(false);
    onChange(v);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-md px-2 py-1 tracking-wider uppercase transition hover:text-fg ${
          selected && !showValue ? "text-accent" : "text-muted"
        }`}
      >
        {showValue && selected ? (
          <>
            {/* No celular: um ícone de ordenar no lugar de "Ordenar por: Grupo ·", para caber numa linha */}
            <svg viewBox="0 0 24 24" className="size-3.5 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />
            </svg>
            <span className="hidden sm:inline">
              {label}: {selected.group && `${selected.group} · `}
            </span>
            {selected.label}
          </>
        ) : selected ? (
          selected.label
        ) : (
          label
        )}
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        // pt-1 em vez de margem: o menu fica "colado" e não fecha ao mover o mouse até ele
        <div className="absolute end-0 top-full z-30 pt-1">
          <ul className="max-h-[28rem] w-56 overflow-y-auto rounded-lg border border-border bg-surface py-1 text-sm normal-case shadow-xl">
            {anyLabel && (
              <Item active={!value} onClick={() => pick(null)}>
                {anyLabel}
              </Item>
            )}
            {options.map((o, i) => (
              <Fragment key={o.value}>
                {/* Título do tópico antes da primeira opção dele */}
                {o.group && o.group !== options[i - 1]?.group && (
                  <li className="px-3 pt-2 pb-0.5 text-xs font-semibold text-muted">{o.group}</li>
                )}
                {/* Com tópicos no menu, as opções soltas (popularidade) ficam no mesmo recuo das outras */}
                <Item active={o.value === value} onClick={() => pick(o.value)} indent={options.some((x) => x.group)}>
                  {o.label}
                </Item>
              </Fragment>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Item({
  active,
  onClick,
  indent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  indent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between py-1.5 pe-3 text-start hover:bg-surface-2 ${indent ? "ps-6" : "ps-3"} ${
          active ? "font-semibold text-fg" : "text-muted"
        }`}
      >
        {children}
        {active && <span className="text-accent">✓</span>}
      </button>
    </li>
  );
}
