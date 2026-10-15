import Link from "next/link";
import Image from "next/image";
import { StarsDisplay } from "./stars";
import { itemHref, itemTitle, type Item } from "@/lib/types";
import type { Locale } from "@/lib/i18n/dictionaries";

type Props = {
  item: Item;
  locale: Locale;
  rating?: number | null;
  liked?: boolean;
  showMeta?: boolean;
  eager?: boolean;
};

export function Poster({ item, locale, rating, liked, showMeta = true, eager }: Props) {
  const title = itemTitle(item, locale);
  return (
    <Link href={itemHref(item)} className="group block" title={item.year ? `${title} (${item.year})` : title}>
      <PosterImage url={item.poster_url} title={title} eager={eager} />
      {showMeta && (rating || liked) ? (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <StarsDisplay rating={rating ?? null} />
          {liked && <span className="text-like">♥</span>}
        </div>
      ) : null}
    </Link>
  );
}

export function PosterImage({ url, title, eager }: { url: string | null; title: string; eager?: boolean }) {
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface-2 ring-1 ring-border transition group-hover:ring-2 group-hover:ring-accent">
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
