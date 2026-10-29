import { expect, open, t, test } from "./support";

const FOLDERS = [
  ["movies", "movie", "/movie/"],
  ["series", "series", "/series/"],
  ["books", "book", "/book/"],
  ["anime", "anime", "/anime/"],
  ["manga", "manga", "/manga/"],
  ["games", "game", "/game/"],
] as const;

test.describe("Ver tudo das pastas", () => {
  for (const [slug, kind, prefix] of FOLDERS) {
    test(`${slug}: cabeçalho padrão, contagem e pôsteres @mobile`, async ({ page }) => {
      await open(page, `/browse/${slug}`);
      await expect(page.locator("main h1")).toContainText(t.folders.allOf(t.folders[kind]));
      await expect(page.locator("main").getByRole("link", { name: t.common.back })).toBeVisible();
      await expect(page.locator(`main a[href^="${prefix}"]`).first()).toBeVisible();
    });
  }

  test("músicas: aviso de 'Em breve'", async ({ page }) => {
    await open(page, "/browse/music");
    await expect(page.getByText(t.folders.soon)).toBeVisible();
  });

  test("filtro de gênero e ordenação mudam o endereço e os resultados", async ({ page }) => {
    await open(page, "/browse/movies");
    const first = await page.locator('main a[href^="/movie/"]').first().getAttribute("href");
    await page.getByRole("button", { name: t.movies.filters.genre }).click();
    await page.locator("main ul button").nth(1).click(); // o primeiro gênero da lista (depois de "Qualquer")
    await expect(page).toHaveURL(/genre=\d+/);
    await page.getByRole("button", { name: new RegExp(t.movies.filters.sortBy) }).click();
    await page.getByRole("button", { name: t.movies.sortOrder.highest, exact: true }).click();
    await expect(page).toHaveURL(/sort=top/);
    await expect(page.locator('main a[href^="/movie/"]').first()).not.toHaveAttribute("href", first!);
    // "Limpar filtros" tira o gênero
    await page.getByRole("button", { name: t.movies.filters.clear }).click();
    await expect(page).not.toHaveURL(/genre=/);
  });

  test("Mais aguardados só traz o que ainda não lançou", async ({ page }) => {
    await open(page, "/browse/movies?sort=anticipated");
    await expect(page.getByRole("button", { name: new RegExp(t.movies.sortOrder.anticipated) })).toBeVisible();
    const years = await page.locator("main a.line-clamp-2 span.text-muted").allInnerTexts();
    const thisYear = new Date().getFullYear();
    expect(years.length).toBeGreaterThan(0);
    for (const y of years.filter((y) => /^\d{4}$/.test(y))) expect(Number(y)).toBeGreaterThanOrEqual(thisYear);
  });

  test("livros mostram o autor na legenda (antes do ano)", async ({ page }) => {
    await open(page, "/browse/books");
    const byline = page.locator('main a.line-clamp-2[href^="/book/"] span.text-muted').first();
    // "de Fulano" (pt) / "by Fulano" (en): o prefixo do dicionário seguido de um nome
    await expect(byline).toHaveText(new RegExp("^" + t.book.by("") + "\\S"));
  });

  test("temporada de anime: navega para a anterior e a próxima", async ({ page }) => {
    await open(page, "/anime/season");
    const title = await page.locator("main h1").innerText();
    await page.getByRole("link", { name: t.anime.prevSeason }).or(page.locator(`main a[title="${t.anime.prevSeason}"]`)).first().click();
    await expect(page).toHaveURL(/season=/);
    await expect(page.locator("main h1")).not.toHaveText(title);
  });
});
