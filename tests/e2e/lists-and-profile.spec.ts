import { discoverList, expect, open, t, test } from "./support";

test.describe("Listas (visitante)", () => {
  test("Todas as listas: cabeçalho, filtro de pasta e ordenação no endereço", async ({ page }) => {
    await open(page, "/lists");
    await expect(page.locator("main h1")).toContainText(t.lists.allTitle);
    await page.getByRole("button", { name: t.movies.filters.folder }).click();
    await page.getByRole("button", { name: t.folders.movie, exact: true }).click();
    await expect(page).toHaveURL(/folder=movie/);
    await page.getByRole("button", { name: new RegExp(t.movies.filters.sortBy) }).click();
    await page.getByRole("button", { name: t.movies.sortOrder.mostCommented, exact: true }).click();
    await expect(page).toHaveURL(/sort=comments/);
  });

  test("cartão de lista: curtir e salvar ao passar o mouse levam visitante para o login", async ({ page, request }) => {
    test.skip(!(await discoverList(request)), "nenhuma lista no banco");
    await open(page, "/lists");
    const card = page.locator("main .group").filter({ has: page.locator('a[href*="/list/"]') }).first();
    await card.hover();
    await card.locator(`button[title="${t.lists.like}"]`).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("página da lista: voltar, curtir/salvar/⋯ e comentários", async ({ page, request }) => {
    const found = await discoverList(request);
    test.skip(!found, "nenhuma lista no banco");
    await open(page, found!.listPath);
    await expect(page.locator("main").getByRole("link", { name: t.common.back })).toBeVisible();
    await expect(page.getByRole("link", { name: t.lists.saveList })).toBeVisible();
    // O ♥ mostra o número de curtidas: o nome dele vem do título
    await expect(page.locator(`main a[title="${t.lists.like}"]`)).toBeVisible();
    await expect(page.getByRole("heading", { name: t.lists.comments })).toBeVisible();
    await expect(page.getByRole("link", { name: t.comments.signIn })).toBeVisible();
    // ⋯ → Denunciar (visitante vai para o login)
    await page.getByRole("button", { name: t.report.more }).first().click();
    await expect(page.getByRole("link", { name: t.report.report })).toHaveAttribute("href", "/login");
  });
});

test.describe("Perfil (visitante)", () => {
  test("perfil: números, pastas, seções e amigos", async ({ page, request }) => {
    const found = await discoverList(request);
    test.skip(!found, "nenhum perfil conhecido");
    await open(page, `/u/${found!.username}`);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByRole("heading", { name: t.profile.watchlist })).toBeVisible();
    // Cada pasta do carrossel abre a pasta
    const folderLink = page.locator(`main a[href="/u/${found!.username}/movies"]`).first();
    await folderLink.click();
    await expect(page).toHaveURL(new RegExp(`/u/${found!.username}/movies`));
  });

  test("pasta do perfil: abas, filtros e a aba Listas com filtro de pasta @mobile", async ({ page, request }) => {
    const found = await discoverList(request);
    test.skip(!found, "nenhum perfil conhecido");
    const base = `/u/${found!.username}/movies`;
    await open(page, base);
    await expect(page.getByRole("link", { name: t.movies.tabs.watched, exact: true })).toHaveAttribute("aria-current", "page");
    for (const tab of [t.movies.tabs.liked, t.movies.tabs.watchlist, t.movies.tabs.reviews, t.movies.tabs.lists]) {
      await page.locator("main").getByRole("link", { name: tab, exact: true }).click();
      await expect(page.locator("main").getByRole("link", { name: tab, exact: true })).toHaveAttribute("aria-current", "page");
    }
    await expect(page.getByRole("button", { name: t.movies.filters.folder })).toBeVisible();
  });
});
