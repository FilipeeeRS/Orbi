"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n";
import { useToast } from "@/components/toast";

type Labels = { add: string; is: string; remove: string };

// Grava direto no Supabase; a RLS só deixa seguir/deixar de seguir como você mesmo.
export function FollowButton({
  viewerId,
  profileId,
  initial,
  labels,
  name,
}: {
  viewerId: string;
  profileId: string;
  initial: boolean;
  labels: Labels;
  name?: string; // para o aviso "Seguindo fulano"
}) {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [following, setFollowing] = useState(initial);
  const [hover, setHover] = useState(false);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    start(async () => {
      const supabase = createClient();
      const { error } = next
        ? await supabase.from("follows").insert({ follower_id: viewerId, followee_id: profileId })
        : await supabase.from("follows").delete().eq("follower_id", viewerId).eq("followee_id", profileId);
      if (error) {
        setFollowing(!next);
        toast({ message: t.toast.error, tone: "error" });
      } else if (name) toast({ message: next ? t.toast.following(name) : t.toast.unfollowed(name) });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase transition disabled:opacity-60 ${
        following
          ? hover
            ? "bg-danger/15 text-danger"
            : "bg-ok/15 text-ok"
          : "bg-accent text-accent-fg hover:opacity-90"
      }`}
    >
      {following ? (hover ? labels.remove : `✓ ${labels.is}`) : `+ ${labels.add}`}
    </button>
  );
}
