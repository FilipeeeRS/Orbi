import { test, expect, t, open, PUBLIC_ROUTES } from "./support";

// Padronização: passa por todas as telas públicas e confere se elas seguem as mesmas regras
// (títulos, seções, textos, botões, imagens e busca). Cada problema aparece com a tela e o elemento.
// Telas com título grande próprio (a obra, a página inicial, o login) não entram na regra do cabeçalho.
const HERO_PAGES = new Set(["inicio", "filme", "serie", "temporada", "livro", "jogo", "anime", "manga", "login"]);

// Palavras de interface em inglês que não podem aparecer com o site em português
// ("Watchlist" e "Reviews" são usadas de propósito e ficam de fora).
const ENGLISH = ["Save", "Cancel", "Delete", "Close", "Back", "Edit", "See all", "View all", "Load more", "Sign in", "Sign up", "Log in", "Next", "Previous", "Search", "Share", "Follow", "Unfollow", "Like", "Report", "Submit", "Loading…", "Loading...", "Remove", "Add"];

type Rules = { searchPlaceholder: string; seeAll: string; english: string[]; hero: boolean };

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} (${route.path}) segue o padrão`, async ({ page }) => {
    await open(page, route.path);
    // Espera as partes que carregam depois (Suspense) terminarem
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

    const problems = await page.evaluate(
      ({ searchPlaceholder, seeAll, english, hero }: Rules) => {
        const out: string[] = [];
        const visible = (el: Element) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
        };
        const describe = (el: Element) => `<${el.tagName.toLowerCase()}> "${(el.textContent ?? "").trim().slice(0, 40)}"`;
        const nameOf = (el: Element) =>
          (el.textContent ?? "").trim() ||
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          [...el.querySelectorAll("img[alt]")].map((i) => i.getAttribute("alt")).join("").trim() ||
          (el.getAttribute("aria-labelledby") ? "x" : "");

        // 1. Título da aba: "Nome · Orbi" (só a página inicial pode ser só "Orbi")
        if (!/^(.+ · )?Orbi$/.test(document.title)) out.push(`título da aba fora do padrão: "${document.title}"`);

        // 2. Um único título principal
        const h1s = [...document.querySelectorAll("h1")].filter((h) => !h.closest("dialog"));
        if (h1s.length !== 1) out.push(`deveria ter 1 título principal (h1), tem ${h1s.length}`);

        // 3. Cabeçalho das telas de listagem e conta: igual em todas (24px, extra negrito)
        if (!hero && h1s[0]) {
          const s = getComputedStyle(h1s[0]);
          if (s.fontSize !== "24px" || s.fontWeight !== "800") out.push(`título principal com outro estilo: ${s.fontSize} ${s.fontWeight}`);
        }

        // 4. Títulos de seção: o padrão pequeno em caixa alta, ou o de texto corrido (Sobre, Termos...)
        for (const h of document.querySelectorAll("main h2")) {
          if (!visible(h) || h.closest("dialog")) continue;
          const s = getComputedStyle(h);
          const section = s.fontSize === "12px" && s.textTransform === "uppercase" && s.fontWeight === "600";
          const article = !!h.closest("article") && s.fontSize === "24px" && s.fontWeight === "700";
          if (!section && !article) out.push(`título de seção fora do padrão (${s.fontSize} ${s.fontWeight} ${s.textTransform}): ${describe(h)}`);
        }

        // 5. "Ver tudo" das seções sempre com o mesmo texto
        for (const a of document.querySelectorAll("main h2 + a")) {
          const text = (a.textContent ?? "").trim();
          if (text !== seeAll && !/^\d/.test(text)) out.push(`link da seção com outro texto: "${text}" (o padrão é "${seeAll}")`);
        }

        // 6. Texto quebrado ou marca do dicionário que não foi trocada
        const body = document.body.innerText;
        const leak = body.match(/\bundefined\b|\bNaN\b|\[object Object\]|\{(terms|privacy|email|cookies|settings|tmdb|anilist|openlibrary|steam|d|u|n)\}/);
        if (leak) out.push(`texto quebrado na tela: "${leak[0]}"`);

        // 7. Botões e links sempre com nome (texto, aria-label ou title)
        for (const el of document.querySelectorAll("button, a[href], [role=button]")) {
          if (visible(el) && !nameOf(el)) out.push(`${el.tagName.toLowerCase()} sem nome: ${el.outerHTML.slice(0, 120)}`);
        }

        // 8. Toda imagem com alt (vazio quando é só decoração)
        for (const img of document.querySelectorAll("img:not([alt])")) out.push(`imagem sem alt: ${(img as HTMLImageElement).src.slice(0, 80)}`);

        // 9. Nada de interface em inglês
        for (const el of document.querySelectorAll("button, a, [aria-label], input[placeholder]")) {
          const labels = [(el.textContent ?? "").trim(), el.getAttribute("aria-label") ?? "", el.getAttribute("placeholder") ?? ""];
          const hit = labels.find((l) => english.includes(l));
          if (hit) out.push(`texto em inglês: "${hit}" em ${describe(el)}`);
        }

        // 10. Toda caixa de busca geral diz a mesma coisa
        for (const input of document.querySelectorAll("input[role=combobox]")) {
          const placeholder = input.getAttribute("placeholder");
          if (placeholder !== searchPlaceholder) out.push(`busca com outro texto: "${placeholder}" (o padrão é "${searchPlaceholder}")`);
        }

        return [...new Set(out)];
      },
      { searchPlaceholder: t.nav.search, seeAll: t.profile.all, english: ENGLISH, hero: HERO_PAGES.has(route.name) },
    );

    expect(problems, `problemas de padronização em ${route.path}`).toEqual([]);
  });
}
