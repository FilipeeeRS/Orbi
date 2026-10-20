"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SearchSuggest } from "./search-suggest";

// Campo de busca do topo. Na página de busca, mostra o termo atual (ex.: o nome do diretor clicado).
// Na página inicial de quem não está logado a busca fica no meio da tela, então some do topo.
export function SearchBox({ placeholder, hideOnLanding }: { placeholder: string; hideOnLanding?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/search" ? (params.get("q") ?? "") : "";
  if (hideOnLanding && pathname === "/") return <div className="ms-auto" />;

  return <SearchSuggest key={current} placeholder={placeholder} defaultValue={current} className="ms-auto w-full max-w-xs" />;
}
