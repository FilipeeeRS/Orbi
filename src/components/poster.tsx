import Link from "next/link";
import Image from "next/image";
import { PosterActions, type ViewerItemState } from "./poster-actions";
import { itemHref, itemTitle, type Item } from "@/lib/types";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

type Props = {
  item: Item;
  locale: Locale;
  eager?: boolean;
  // Quem está logado: habilita os atalhos de "visto" e "curtir" ao passar o mouse.
  viewer?: { id: string; state: ViewerItemState | null } | null;
  badge?: boolean; // selo do status no canto do pôster (false no perfil e nas listas do usuário)
};

export function Poster({ item, locale, eager, viewer, badge = true }: Props) {
  const title = itemTitle(item, locale);
  return (
    <div className="group">
      {/* Os atalhos ficam presos à imagem, não ao bloco com estrelas embaixo */}
      <div className="relative">
        <Link href={itemHref(item)} className="block" title={item.year ? `${title} (${item.year})` : title}>
          <PosterImage url={item.poster_url} title={title} eager={eager} hoverRing={!viewer} />
        </Link>
        {viewer && (
          <PosterActions
            itemId={item.id}
            viewerId={viewer.id}
            initial={viewer.state}
            series={item.kind !== "movie" && item.kind !== "music"}
            badge={badge}
            unreleased={isUnreleased(item)}
            verb={item.kind === "book" || item.kind === "manga" ? "read" : item.kind === "game" ? "play" : "watch"}
          />
        )}
      </div>
      <PosterCaption href={itemHref(item)} title={title} year={item.year} by={item.kind === "book" && item.original_title ? dictionaries[locale].book.by(item.original_title) : null} />
    </div>
  );
}

export function PosterImage({
  url,
  title,
  eager,
  watched,
  hoverRing = true,
}: {
  url: string | null;
  title: string;
  eager?: boolean;
  // Já visto pelo usuário logado: a borda de hover fica verde.
  watched?: boolean;
  hoverRing?: boolean;
}) {
  return (
    <div
      // select-none / touch-callout: segurar o dedo no celular abre os atalhos, não o menu de "salvar imagem"
      className={`relative aspect-[2/3] overflow-hidden rounded-md bg-surface-2 ring-1 ring-border transition select-none [-webkit-touch-callout:none] ${
        hoverRing ? `group-hover:ring-2 ${watched ? "group-hover:ring-ok" : "group-hover:ring-fg"}` : ""
      }`}
    >
      {url ? (
        <Image
          src={url}
          alt={title}
          fill
          sizes="(max-width: 640px) 33vw, 160px"
          className="object-cover"
          loading={eager ? "eager" : "lazy"}
        />
      ) : (
        <div className="grid h-full place-items-center p-2 text-center text-xs text-muted">{title}</div>
      )}
    </div>
  );
}

export function PosterGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">{children}</div>;
}

// Embaixo de todo pôster do site: nome e ano (muitas capas, como as de anime e mangá, não têm o nome escrito).
// A nota que a pessoa deu fica no canto de cima do pôster, ao lado do selo do status.
// by: "by James Clear" (livros), já no idioma da pessoa
export function PosterCaption({ href, title, year, by }: { href: string; title: string; year: number | null; by?: string | null }) {
  return (
    <Link href={href} className="mt-1 line-clamp-2 block text-xs">
      {title} {/* Livros: o autor em cinza, do tamanho do ano, antes dele */}
      {by && <span className="text-muted">{by} </span>}
      {year && <span className="text-muted">{year}</span>}
    </Link>
  );
}

// Ainda não lançado: data de estreia no futuro ou, em anime/mangá, situação "ainda não lançado".
export const isUnreleased = (item: { release_date: string | null; status?: string | null }) =>
  item.status === "NOT_YET_RELEASED" || (!!item.release_date && item.release_date > new Date().toISOString().slice(0, 10));
