import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";
import { pt } from "../../src/lib/i18n/locales/pt";

// Os textos da tela vêm do dicionário em português (os testes abrem o site em pt-BR).
export const t = pt;
export { expect };

// Avisos do console que não são problema do Orbi (imagens que o CDN não tem, ferramentas do modo dev).
const NOISE = [
  /Failed to load resource/i,
  /net::ERR_/i,
  /Download the React DevTools/i,
  /\[HMR\]/i,
  /\[Fast Refresh\]/i,
  /was preloaded using link preload/i,
];

// Todo teste junta os erros do console e da página; no fim, qualquer erro reprova (e vai anexado ao relatório).
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && !NOISE.some((re) => re.test(msg.text()))) errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(`${err.name}: ${err.message}`));
      await use(errors);
      if (errors.length) {
        await testInfo.attach("erros-do-console.txt", { body: errors.join("\n\n"), contentType: "text/plain" });
        expect.soft(errors, "a página não deveria ter erros no console").toEqual([]);
      }
    },
    { auto: true },
  ],
});

// Abre a página e espera o conteúdo principal (o servidor de desenvolvimento pode demorar).
export async function open(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toBeVisible();
  return response;
}

// A tela de "não encontrado" ou de erro não pode aparecer.
export async function expectNoErrorScreen(page: Page) {
  await expect(page.getByRole("heading", { name: t.errors.notFoundTitle })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: t.errors.title })).toHaveCount(0);
}

// Nada passando da largura da tela (sem rolagem para os lados).
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "a página não deveria rolar para os lados").toBeLessThanOrEqual(1);
}

// Páginas de visitante que todo teste pode abrir. Obras escolhidas por serem estáveis nas fontes.
export const PUBLIC_ROUTES: { name: string; path: string }[] = [
  { name: "inicio", path: "/" },
  { name: "home-novidades", path: "/home" },
  { name: "home-filmes", path: "/home?folder=movie" },
  { name: "home-series", path: "/home?folder=series" },
  { name: "home-livros", path: "/home?folder=book" },
  { name: "home-animes", path: "/home?folder=anime" },
  { name: "home-mangas", path: "/home?folder=manga" },
  { name: "home-jogos", path: "/home?folder=game" },
  { name: "home-musicas", path: "/home?folder=music" },
  { name: "todos-filmes", path: "/browse/movies" },
  { name: "todos-filmes-aguardados", path: "/browse/movies?sort=anticipated" },
  { name: "todas-series", path: "/browse/series" },
  { name: "todos-livros", path: "/browse/books" },
  { name: "todos-animes", path: "/browse/anime" },
  { name: "todos-mangas", path: "/browse/manga" },
  { name: "todos-jogos", path: "/browse/games" },
  { name: "todas-musicas", path: "/browse/music" },
  { name: "temporada-anime", path: "/anime/season" },
  { name: "todas-listas", path: "/lists" },
  { name: "busca-tudo", path: "/search?q=batman" },
  { name: "busca-filmes", path: "/search?q=batman&type=movie" },
  { name: "busca-series", path: "/search?q=batman&type=series" },
  { name: "busca-livros", path: "/search?q=harry%20potter&type=book" },
  { name: "busca-animes", path: "/search?q=naruto&type=anime" },
  { name: "busca-mangas", path: "/search?q=naruto&type=manga" },
  { name: "busca-jogos", path: "/search?q=portal&type=game" },
  { name: "filme", path: "/movie/603" },
  { name: "serie", path: "/series/1399" },
  { name: "temporada", path: "/series/1399/season/1" },
  { name: "livro", path: "/book/OL81633W" },
  { name: "jogo", path: "/game/620" },
  { name: "anime", path: "/anime/21" },
  { name: "manga", path: "/manga/30013" },
  { name: "sobre", path: "/about" },
  { name: "login", path: "/login" },
];

// Um perfil e uma lista de verdade, achados pela página "Todas as listas" (o banco muda; nada fixo aqui).
export async function discoverList(request: APIRequestContext): Promise<{ username: string; listPath: string } | null> {
  const html = await (await request.get("/lists")).text();
  const match = html.match(/\/u\/([a-z0-9_]+)\/list\/([0-9a-f-]{36})/i);
  return match ? { username: match[1], listPath: `/u/${match[1]}/list/${match[2]}` } : null;
}
