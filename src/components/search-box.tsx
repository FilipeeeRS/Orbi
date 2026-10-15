"use client";

import { usePathname, useSearchParams } from "next/navigation";

// Campo de busca do topo. Na página de busca, mostra o termo atual (ex.: o nome do diretor clicado).
export function SearchBox({ placeholder }: { placeholder: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/search" ? (params.get("q") ?? "") : "";

  return (
    <form action="/search" className="ms-auto w-full max-w-xs">
      <input
        key={current}
        name="q"
        type="search"
        defaultValue={current}
        placeholder={placeholder}
        className="w-full rounded-full border border-border bg-surface px-4 py-1.5 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
    </form>
  );
}
