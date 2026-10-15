import Link from "next/link";
import { Avatar } from "@/components/header";
import type { Profile } from "@/lib/types";

export function ProfileHeader({ profile, isOwner, editLabel }: { profile: Profile; isOwner: boolean; editLabel: string }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar profile={profile} size={72} />
      <div className="min-w-0 flex-1">
        <Link href={`/u/${profile.username}`} className="block truncate text-2xl font-bold hover:text-accent">
          {profile.display_name || profile.username}
        </Link>
        <p className="text-sm text-muted">@{profile.username}</p>
        {profile.bio && <p className="mt-2 max-w-xl text-sm text-balance">{profile.bio}</p>}
      </div>
      {isOwner && (
        <Link href="/settings" className="hidden rounded-full border border-border px-4 py-1.5 text-sm hover:bg-surface-2 sm:block">
          {editLabel}
        </Link>
      )}
    </div>
  );
}
