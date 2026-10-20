import Link from "next/link";
import Image from "next/image";
import { StarsDisplay } from "./stars";
import { PosterActions, type ViewerItemState } from "./poster-actions";
import { itemHref, itemTitle, type Item } from "@/lib/types";
import type { Locale } from "@/lib/i18n/dictionaries";

type Props = {
  item: Item;
  locale: Locale;
  rating?: number | null;
  liked?: boolean;
  showMeta?: boolean;
  eager?: boolean;
  // Quem está logado: habilita os atalhos de "visto" e "curtir" ao passar o mouse.
  viewer?: { id: string; state: ViewerItemState | null } | null;
  badge?: boolean; // selo do status no canto do pôster (false no perfil e nas listas do usuário)
};

export function Poster({ item, locale, rating, liked, showMeta = true, eager, viewer, badge = true }: Props) {
  const title = itemTitle(item, locale);
  return (
    <div className="group">
      {/* Os atalhos ficam presos à imagem, não ao bloco com estrelas embaixo */}
      <div className="relative">
        <Link href={itemHref(item)} className="block" title={item.year ? `${title} (${item.year})` : title}>
          <PosterImage url={item.poster_url} title={title} eager={eager} hoverRing={!viewer} />
        </Link>
        {viewer && (
          <PosterActions itemId={item.id} viewerId={viewer.id} initial={viewer.state} series={item.kind === "series" || item.kind === "anime" || item.kind === "manga"} badge={badge} />
        )}
      </div>
      {showMeta && (rating || liked) ? (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <StarsDisplay rating={rating ?? null} />
          {liked && <span className="text-like">♥</span>}
        </div>
      ) : null}
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
      className={`relative aspect-[2/3] overflow-hidden rounded-md bg-surface-2 ring-1 ring-border transition ${
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
