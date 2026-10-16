// Bordas da foto de perfil (Configurações → Foto de perfil). Os nomes batem com o check do banco.
// Além das prontas, a pessoa pode escolher qualquer cor: o valor é o hex ("#ff00aa").
export const AVATAR_RINGS = ["none", "theme", "silver", "obsidian", "gold", "rosegold", "rainbow"] as const;
export type AvatarRingPreset = (typeof AVATAR_RINGS)[number];
export type AvatarRing = AvatarRingPreset | `#${string}`;

const HEX = /^#[0-9a-f]{6}$/;

export function isCustomRing(value: string): value is `#${string}` {
  return HEX.test(value);
}

export function isAvatarRing(value: unknown): value is AvatarRing {
  return typeof value === "string" && ((AVATAR_RINGS as readonly string[]).includes(value) || isCustomRing(value));
}

// Fundo de cada borda; "theme" acompanha a cor de destaque do tema de quem está vendo.
const PRESET_BACKGROUND: Record<Exclude<AvatarRingPreset, "none">, string> = {
  theme: "var(--accent)",
  silver: "linear-gradient(135deg, #ffffff, #c9ced6 30%, #ffffff 50%, #8f96a1 75%, #f4f6f8)",
  obsidian: "linear-gradient(135deg, #5a5a63, #0a0a0b 35%, #34343b 55%, #000000 80%, #46464e)",
  gold: "linear-gradient(135deg, #fff3b0, #d4a017 30%, #fff1a8 50%, #b8860b 75%, #ffe27a)",
  rosegold: "linear-gradient(135deg, #ffe3d8, #d4877a 35%, #f9cbbd 55%, #b76e79 80%, #ffd9cc)",
  rainbow: "conic-gradient(#ff3b52, #ff8a1f, #ffd23f, #22c55e, #3b9eff, #a855f7, #ff3b52)",
};

// null = sem borda (inclui valores antigos que não existem mais, como "white" e "black").
export function ringBackground(ring: string | null | undefined): string | null {
  if (!ring || ring === "none") return null;
  if (isCustomRing(ring)) return ring;
  return PRESET_BACKGROUND[ring as Exclude<AvatarRingPreset, "none">] ?? null;
}
