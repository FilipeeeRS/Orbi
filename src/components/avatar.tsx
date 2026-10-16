import Image from "next/image";
import { ringBackground, type AvatarRing } from "@/lib/avatar-ring";
import type { Profile } from "@/lib/types";

export function Avatar({
  profile,
  size,
  ring,
}: {
  profile: Pick<Profile, "avatar_url" | "username" | "display_name">;
  size: number;
  // Borda escolhida pelo dono do perfil; sem ela (ou "none") fica só o contorno fino padrão.
  ring?: AvatarRing | null;
}) {
  const label = profile.display_name || profile.username;
  const background = ringBackground(ring);
  // Com borda, a foto encolhe para o conjunto manter o mesmo tamanho total.
  const pad = background ? Math.max(2, Math.round(size * 0.04)) : 0;
  const gap = background ? Math.max(1.5, Math.round(size * 0.03)) : 0;
  const inner = size - 2 * pad;

  const picture = profile.avatar_url ? (
    <Image
      src={profile.avatar_url}
      alt={label}
      width={inner}
      height={inner}
      className={`block rounded-full object-cover ${background ? "" : "ring-1 ring-border"}`}
      style={{ width: inner, height: inner, border: gap ? `${gap}px solid var(--bg)` : undefined }}
    />
  ) : (
    // Sem foto: silhueta padrão de avatar (cinza-azulado, igual em todos os temas).
    <span
      role="img"
      aria-label={label}
      className={`block overflow-hidden rounded-full bg-[#cfd5dc] ${background ? "" : "ring-1 ring-border"}`}
      style={{ width: inner, height: inner, border: gap ? `${gap}px solid var(--bg)` : undefined }}
    >
      <svg viewBox="0 0 24 24" className="size-full" fill="#7d8794" aria-hidden>
        <rect x="8.2" y="5" width="7.6" height="8.6" rx="3.6" />
        <path d="M3.5 24c0-5 3.8-8.6 8.5-8.6s8.5 3.6 8.5 8.6z" />
      </svg>
    </span>
  );

  if (!background) return picture;
  return (
    <span
      className="flex shrink-0 rounded-full"
      style={{ padding: pad, background, width: size, height: size }}
    >
      {picture}
    </span>
  );
}
