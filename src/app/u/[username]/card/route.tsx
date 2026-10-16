import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getItemsByIds, getProfileByUsername, getProfileOverview } from "@/lib/queries";
import { applyArtToItems } from "@/lib/art";
import { getDict, getViewer } from "@/lib/session";
import { isCustomRing } from "@/lib/avatar-ring";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { itemTitle, type Item } from "@/lib/types";

// Cartão do perfil para baixar como imagem (botão ao lado de "copiar link").
// Formato retrato 1080×1350, bom para Instagram/stories. Perfil invisível: a RLS esconde e dá 404.

const W = 1080;
const H = 1350;
const BG = "#0b0b0c";
const FG = "#f2f2f3";
const MUTED = "#94949c";

// O gerador de imagem não lê WebP nem conic-gradient: essas imagens ficam de fora e o arco-íris vira linear.
const usable = (url: string | null | undefined): url is string => !!url && !/\.webp($|\?)/i.test(url);

const RING: Record<string, string> = {
  theme: FG,
  silver: "linear-gradient(135deg, #ffffff, #c9ced6 30%, #ffffff 50%, #8f96a1 75%, #f4f6f8)",
  obsidian: "linear-gradient(135deg, #5a5a63, #0a0a0b 35%, #34343b 55%, #000000 80%, #46464e)",
  gold: "linear-gradient(135deg, #fff3b0, #d4a017 30%, #fff1a8 50%, #b8860b 75%, #ffe27a)",
  rosegold: "linear-gradient(135deg, #ffe3d8, #d4877a 35%, #f9cbbd 55%, #b76e79 80%, #ffd9cc)",
  rainbow: "linear-gradient(135deg, #ff3b52, #ff8a1f, #ffd23f, #22c55e, #3b9eff, #a855f7)",
};

// Fontes do site (o gerador só lê TTF/OTF; num pedido do servidor o Google Fonts entrega TTF).
async function googleFont(family: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`)).text();
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`font ${family}`);
  return (await fetch(url)).arrayBuffer();
}
let fonts: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 600 | 800; style: "normal" }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    googleFont("Geist", 400).then((data) => ({ name: "Geist", data, weight: 400 as const, style: "normal" as const })),
    googleFont("Geist", 600).then((data) => ({ name: "Geist", data, weight: 600 as const, style: "normal" as const })),
    googleFont("Bricolage Grotesque", 800).then((data) => ({ name: "Bricolage", data, weight: 800 as const, style: "normal" as const })),
    googleFont("Syne", 800).then((data) => ({ name: "Syne", data, weight: 800 as const, style: "normal" as const })),
  ]).catch((e) => {
    fonts = null; // tenta de novo na próxima vez
    throw e;
  });
  return fonts;
}

function Star({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#f5b62a">
      <path d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z" />
    </svg>
  );
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/u/[username]/card">) {
  const { username } = await ctx.params;
  const profile = await getProfileByUsername(username);
  if (!profile) return new Response("Not found", { status: 404 });

  const viewer = await getViewer();
  const [{ t, locale }, o, chosen, fontData] = await Promise.all([
    getDict(),
    getProfileOverview(profile.id, "movie", viewer?.id ?? null),
    getItemsByIds(profile.favorites ?? []).then((items) => (viewer ? applyArtToItems(viewer.id, items) : items)),
    loadFonts().catch(() => undefined),
  ]);
  // Mesma regra do perfil: escolhidos primeiro, completando com os curtidos mais recentes.
  const chosenIds = new Set(chosen.map((i) => i.id));
  const favorites: Item[] = [...chosen, ...o.favorites.map((e) => e.items).filter((i) => !chosenIds.has(i.id))].slice(0, 4);

  const name = profile.display_name || profile.username;
  const ring = profile.avatar_ring && profile.avatar_ring !== "none"
    ? isCustomRing(profile.avatar_ring) ? profile.avatar_ring : RING[profile.avatar_ring]
    : null;
  const ratings = o.ratingCounts.reduce((a, b) => a + b, 0);
  const average = ratings ? o.ratingCounts.reduce((s, c, i) => s + c * (i + 1), 0) / ratings / 2 : null;
  const fmt = new Intl.NumberFormat(dictionaries[locale].htmlLang);
  const stats = [
    { label: t.folders.movie, value: fmt.format(o.watched) },
    { label: t.profile.watchlist, value: fmt.format(o.watchlist) },
    ...(average !== null ? [{ label: t.profile.average, value: average.toFixed(1), star: true }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: BG, color: FG, position: "relative", fontFamily: "Geist" }}>
        {/* Capa no topo, dissolvendo no fundo */}
        {usable(profile.cover_url) && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem do gerador (Satori), não do navegador
          <img src={profile.cover_url} alt="" width={W} height={560} style={{ position: "absolute", top: 0, left: 0, width: W, height: 560, objectFit: "cover" }} />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: 600,
            background: `linear-gradient(to bottom, rgba(11,11,12,0.15) 0%, rgba(11,11,12,0.55) 55%, ${BG} 100%)`,
          }}
        />
        {usable(profile.sticker_url) && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem do gerador (Satori)
          <img src={profile.sticker_url} alt="" height={260} style={{ position: "absolute", top: 70, right: 70, height: 260, objectFit: "contain" }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", padding: "0 80px", marginTop: 290, gap: 26 }}>
          {/* Foto com a borda escolhida */}
          <div
            style={{
              display: "flex",
              width: 200,
              height: 200,
              borderRadius: 999,
              padding: ring ? 9 : 0,
              background: ring ?? "transparent",
            }}
          >
            <div style={{ display: "flex", width: "100%", height: "100%", borderRadius: 999, border: `7px solid ${BG}`, background: "#cfd5dc", overflow: "hidden" }}>
              {usable(profile.avatar_url) ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem do gerador (Satori)
                <img src={profile.avatar_url} alt="" width={200} height={200} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <svg viewBox="0 0 24 24" width="100%" height="100%" fill="#7d8794">
                  <rect x="8.2" y="5" width="7.6" height="8.6" rx="3.6" />
                  <path d="M3.5 24c0-5 3.8-8.6 8.5-8.6s8.5 3.6 8.5 8.6z" />
                </svg>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 32, color: MUTED }}>@{profile.username}</div>
            {profile.bio && (
              <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, marginTop: 6, maxWidth: 900 }}>
                {profile.bio.length > 140 ? `${profile.bio.slice(0, 140)}…` : profile.bio}
              </div>
            )}
          </div>

          {/* Números */}
          <div style={{ display: "flex", gap: 64, marginTop: 4 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Bricolage", fontSize: 54, fontWeight: 800 }}>
                  {s.value}
                  {"star" in s && <Star size={40} />}
                </div>
                <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, color: MUTED, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Favoritos */}
          {favorites.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
              <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, color: MUTED, textTransform: "uppercase" }}>{t.profile.favorites}</div>
              <div style={{ display: "flex", gap: 20 }}>
                {favorites.map((item) => (
                  <div key={item.id} style={{ display: "flex", width: 207, height: 310, borderRadius: 14, overflow: "hidden", background: "#1d1d20" }}>
                    {usable(item.poster_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- imagem do gerador (Satori)
                      <img src={item.poster_url} alt="" width={207} height={310} style={{ width: 207, height: 310, objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", padding: 16, fontSize: 22, color: MUTED }}>{itemTitle(item, locale)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com a logo */}
        <div style={{ marginTop: "auto", padding: "0 80px 52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg viewBox="0 0 40 40" width="52" height="52">
              <g transform="rotate(-25 20 20)">
                <ellipse cx="20" cy="20" rx="17" ry="6" fill="none" stroke={FG} strokeWidth="2.5" opacity="0.4" />
                <circle cx="20" cy="20" r="8.5" fill={FG} />
                <path d="M3 20a17 6 0 0 0 34 0" fill="none" stroke={BG} strokeWidth="5.5" />
                <path d="M3 20a17 6 0 0 0 34 0" fill="none" stroke={FG} strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="29.2" cy="25" r="4.2" fill={BG} />
                <circle cx="29.2" cy="25" r="2.5" fill={FG} />
              </g>
            </svg>
            <div style={{ display: "flex", fontFamily: "Syne", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>orbi</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, color: MUTED }}>{`orbi/u/${profile.username}`}</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fontData, headers: { "Cache-Control": "no-store" } },
  );
}
