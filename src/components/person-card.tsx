import Link from "next/link";
import { Avatar } from "./avatar";
import { FollowButton } from "@/app/u/[username]/follow-button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PersonCard as Person } from "@/lib/people";

// Uma pessoa do Orbi (busca de pessoas, "Quem seguir"): foto, nome, @, seguidores, bio e o botão de seguir.
export function PersonCard({ person, viewerId, t }: { person: Person; viewerId: string | null; t: Dictionary }) {
  const name = person.display_name || person.username;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-3">
      <Link href={`/u/${person.username}`} className="shrink-0">
        <Avatar profile={person} size={48} ring={person.avatar_ring} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/u/${person.username}`} className="block truncate font-semibold hover:text-accent">
          {name}
        </Link>
        <p className="truncate text-xs text-muted">
          @{person.username} · {t.people.followers(person.followers)}
        </p>
        {person.bio && <p className="mt-0.5 truncate text-xs text-muted">{person.bio}</p>}
      </div>
      {viewerId && viewerId !== person.id && (
        <FollowButton
          viewerId={viewerId}
          profileId={person.id}
          initial={person.following}
          name={name}
          labels={{ add: t.profile.addFriend, is: t.profile.isFriend, remove: t.profile.removeFriend }}
        />
      )}
    </div>
  );
}
