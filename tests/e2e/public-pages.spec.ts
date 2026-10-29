import { discoverList, expect, expectNoErrorScreen, expectNoHorizontalOverflow, open, PUBLIC_ROUTES, t, test } from "./support";

// Toda página pública abre: resposta ok, título na tela e na aba do navegador, sem tela de erro,
// sem erro no console e (no celular) sem nada passando da largura da tela.
test.describe("Páginas públicas abrem sem erro", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} (${route.path}) @mobile`, async ({ page }, testInfo) => {
      const response = await open(page, route.path);
      expect(response?.status(), "status da resposta").toBeLessThan(400);
      await expect(page.locator("main h1").first()).toBeVisible();
      await expectNoErrorScreen(page);
      const title = await page.title();
      expect(title).not.toMatch(/undefined|null/);
      expect(title.length).toBeGreaterThan(0);
      if (testInfo.project.name === "mobile") await expectNoHorizontalOverflow(page);
    });
  }

  test("perfil, pastas do perfil e página de uma lista @mobile", async ({ page, request }, testInfo) => {
    const found = await discoverList(request);
    test.skip(!found, "nenhuma lista no banco para achar um perfil");
    const { username, listPath } = found!;
    for (const path of [
      `/u/${username}`,
      `/u/${username}/all`,
      `/u/${username}/movies`,
      `/u/${username}/series`,
      `/u/${username}/books`,
      `/u/${username}/anime`,
      `/u/${username}/manga`,
      `/u/${username}/games`,
      `/u/${username}/all?tab=watchlist`,
      `/u/${username}/all?tab=liked`,
      `/u/${username}/all?tab=reviews`,
      `/u/${username}/all?tab=lists`,
      listPath,
    ]) {
      await test.step(path, async () => {
        const response = await open(page, path);
        expect(response?.status()).toBeLessThan(400);
        await expect(page.locator("main h1").first()).toBeVisible();
        await expectNoErrorScreen(page);
        if (testInfo.project.name === "mobile") await expectNoHorizontalOverflow(page);
      });
    }
  });
});

// Endereços que não existem mostram a tela de "não encontrado" (e não uma página quebrada).
test.describe("Endereços inválidos mostram 'não encontrado'", () => {
  for (const path of ["/movie/999999999", "/series/999999999", "/book/nao-existe", "/game/0", "/u/usuario-que-nao-existe-123", "/browse/lixo", "/u/usuario-que-nao-existe-123/movies"]) {
    test(path, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: t.errors.notFoundTitle })).toBeVisible();
      // O botão de voltar ao início está lá
      await expect(page.getByRole("link", { name: t.errors.home })).toBeVisible();
    });
  }
});

// Páginas só de quem está logado mandam para o login (e voltam para a página depois).
test.describe("Páginas privadas pedem login", () => {
  for (const path of ["/settings", "/notifications", "/import", "/movie/new"]) {
    test(path, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/%2F/g, "(%2F|/)")}`));
      await expect(page.getByRole("heading", { name: t.auth.signInTitle })).toBeVisible();
    });
  }
});
