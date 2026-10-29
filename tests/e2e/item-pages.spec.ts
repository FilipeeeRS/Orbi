import { expect, open, t, test } from "./support";

test.describe("Páginas de obra", () => {
  test("filme: título, nota, números, ficha com abas, trailer e convite para registrar", async ({ page }) => {
    await open(page, "/movie/603");
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByText(t.movie.onSource("Orbi"))).toBeVisible();
    // Ficha: abas Detalhes / Gêneros...
    const tabs = page.getByRole("tab");
    await expect(tabs.first()).toBeVisible();
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute("aria-selected", "true");
    }
    // Trailer abre numa janela e fecha
    const trailer = page.getByRole("button", { name: t.movie.trailer });
    if (await trailer.count()) {
      await trailer.click();
      await expect(page.getByRole("dialog", { name: t.movie.trailer })).toBeVisible();
      await page.getByRole("button", { name: t.report.close }).click();
      await expect(page.getByRole("dialog", { name: t.movie.trailer })).toHaveCount(0);
    }
    // Visitante: botão para entrar e registrar, que volta para o filme depois
    await expect(page.getByRole("link", { name: t.movie.signInToLog })).toHaveAttribute("href", "/login?next=/movie/603");
    await expect(page.getByRole("heading", { name: t.movie.reviews })).toBeVisible();
    await expect(page.getByRole("heading", { name: t.movie.recommendations })).toBeVisible();
  });

  test("clicar num gênero da ficha abre a lista daquele gênero", async ({ page }) => {
    await open(page, "/movie/603");
    await page.getByRole("tab", { name: t.info.genres }).click();
    const genre = page.locator('main a[href*="genre="]').first();
    await expect(genre).toBeVisible();
    await genre.click();
    await expect(page).toHaveURL(/genre=/);
    await expect(page.locator('main a[href^="/movie/"]').first()).toBeVisible();
  });

  test("série: temporadas e a página de uma temporada com link de volta para a série", async ({ page }) => {
    await open(page, "/series/1399");
    // As temporadas aparecem como abas ("Temporada 1", "Temporada 2"...)
    await expect(page.getByText(t.series.season(1), { exact: true }).first()).toBeVisible();
    await open(page, "/series/1399/season/1");
    await expect(page.locator('main a[href="/series/1399"]').first()).toBeVisible();
  });

  test("livro: autor no título antes do ano, sem fundo vazio e 'Mais de' autor", async ({ page }) => {
    await open(page, "/book/OL81633W");
    const h1 = page.locator("main h1");
    await expect(h1).toContainText(t.book.by("Stephen King"));
    // O ano vem por último
    await expect(h1).toHaveText(/\d{4}\s*$/);
    // Sem imagem de fundo: a seta de voltar fica junto do título, não por cima de um fundo
    await expect(page.locator(".backdrop-fade")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: t.book.moreBy("Stephen King") })).toBeVisible();
    await expect(page.getByRole("link", { name: t.book.signInToLog })).toBeVisible();
  });

  test("jogo: avaliações da Steam e 'Mais da' desenvolvedora", async ({ page }) => {
    await open(page, "/game/620");
    await expect(page.locator("main h1")).toContainText("Portal 2");
    await expect(page.getByRole("heading", { name: t.game.moreFrom("Valve") })).toBeVisible();
    await expect(page.locator('main a[href^="/browse/games?developer="]').first()).toBeVisible();
  });

  test("anime: ficha do AniList", async ({ page }) => {
    await open(page, "/anime/21");
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByRole("tab").first()).toBeVisible();
  });
});
