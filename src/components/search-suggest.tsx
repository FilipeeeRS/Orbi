"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./i18n";
import type { Suggestion } from "@/lib/suggest";

// Caixa de busca com sugestões enquanto a pessoa digita (filmes, séries e pessoas, mesmo com erro
// de digitação). Setas escolhem, Enter abre a sugestão escolhida ou a página de busca, Esc fecha.
export function SearchSuggest({
  placeholder,
  defaultValue = "",
  size = "sm",
  className = "",
}: {
  placeholder: string;
  defaultValue?: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<{ q: string; list: Suggestion[] }>({ q: "", list: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLFormElement>(null);

  // Busca as sugestões 200 ms depois da última tecla; respostas antigas são descartadas.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((list: Suggestion[]) => {
          setResults({ q, list });
          setActive(-1);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Clique fora fecha a lista.
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const q = query.trim();
  const list = q.length >= 2 && results.q === q ? results.list : [];
  const showList = open && q.length >= 2 && results.q === q;
  const searchHref = `/search?q=${encodeURIComponent(q)}`;

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") return setOpen(false);
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % (list.length + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? list.length : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(active < list.length ? list[active].href : searchHref);
    }
  }

  const typeLabel = { movie: t.search.typeMovie, series: t.search.typeSeries, anime: t.search.typeAnime, person: t.search.typePerson };
  const lg = size === "lg";

  return (
    <form
      ref={boxRef}
      action="/search"
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        if (!q) e.preventDefault();
        setOpen(false);
      }}
    >
      {lg && (
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute start-5 top-1/2 size-5 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      )}
      <input
        name="q"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={
          lg
            ? "w-full rounded-full border border-border bg-surface py-3.5 ps-13 pe-5 text-base outline-none placeholder:text-muted focus:border-accent"
            : "w-full rounded-full border border-border bg-surface px-4 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        }
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface text-start shadow-2xl ${
            lg ? "" : "min-w-72"
          }`}
        >
          {list.map((s, i) => (
            <li key={`${s.type}-${s.id}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => go(s.href)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-start ${i === active ? "bg-surface-2" : ""}`}
              >
                <span
                  className={`relative shrink-0 overflow-hidden bg-surface-2 ${
                    s.type === "person" ? "size-9 rounded-full" : "h-12 w-8 rounded"
                  }`}
                >
                  {s.image && <Image src={s.image} alt="" fill sizes="36px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {s.title} {s.year && <span className="font-normal text-muted">{s.year}</span>}
                  </span>
                  <span className="block text-xs text-muted">{typeLabel[s.type]}</span>
                </span>
              </button>
            </li>
          ))}
          <li id={`${listId}-${list.length}`} role="option" aria-selected={active === list.length}>
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => go(searchHref)}
              onMouseEnter={() => setActive(list.length)}
              className={`block w-full border-t border-border px-3 py-2.5 text-start text-sm text-accent ${
                active === list.length ? "bg-surface-2" : ""
              }`}
            >
              {t.search.seeAll(q)}
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}
