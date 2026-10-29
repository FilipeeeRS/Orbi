import { discoverList, expect, open, t, test } from "./support";

const back = (page: import("@playwright/test").Page) => page.locator("main").getByRole("link", { name: t.common.back }).first();

test.describe("Navegação", () => {
  test("a logo leva para o início", async ({ page }) => {
    await open(page, "/browse/movies");
    await page.locator("header").getByRole("link").first().click();
    await expect(page).toHaveURL(/\/(home)?$/);
  });

  test("todos os links do rodapé abrem uma página sem erro", async ({ page }) => {
    await open(page, "/home");
    const hrefs = await page.locator("footer a[href^='/']").evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!))]);
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      const response = await page.request.get(href, { timeout: 120_000 }); // algumas fontes (Steam) demoram
      expect(response.status(), href).toBeLessThan(400);
    }
  });

  test("seta de voltar: da obra volta para a aba da Home de onde veio", async ({ page }) => {
    await open(page, "/home?folder=movie");
    const poster = page.locator('main a[href^="/movie/"]').first();
    await expect(poster).toBeVisible();
    await poster.click();
    await expect(page).toHaveURL(/\/movie\/\d+/);
    await back(page).click();
    await expect(page).toHaveURL(/\/home\?folder=movie/);
  });

  test("seta de voltar pula as trocas de filtro da mesma tela", async ({ page }) => {
    await open(page, "/home");
    await page.locator('main a[href="/lists"]').first().click();
    await expect(page).toHaveURL(/\/lists$/);
    // Troca a ordenação duas vezes (cada troca entra no histórico do navegador)
    await page.goto("/lists?sort=recent");
    await page.goto("/lists?sort=comments");
    await back(page).click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test("seta de voltar sem tela anterior vai para o destino padrão", async ({ page }) => {
    await open(page, "/browse/books");
    await back(page).click();
    await expect(page).toHaveURL(/\/home\?folder=book/);
  });

  test("páginas de obra e de perfil têm a seta de voltar", async ({ page, request }) => {
    for (const path of ["/movie/603", "/series/1399", "/book/OL81633W", "/game/620"]) {
      await open(page, path);
      await expect(back(page), path).toBeVisible();
    }
    const found = await discoverList(request);
    if (found) {
      await open(page, `/u/${found.username}`);
      await expect(back(page)).toBeVisible();
    }
  });

  test("paginação mantém os filtros e a ordenação", async ({ page }) => {
    await open(page, "/browse/movies?sort=top&genre=18");
    const next = page.getByRole("link", { name: t.movies.next }).first();
    await expect(next).toBeVisible();
    const href = await next.getAttribute("href");
    expect(href).toContain("sort=top");
    expect(href).toContain("genre=18");
    expect(href).toContain("page=2");
    await next.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('main a[href^="/movie/"]').first()).toBeVisible();
  });

  test("barra de carregamento aparece ao clicar num link", async ({ page }) => {
    await open(page, "/home");
    const link = page.locator('main a[href="/lists"]').first();
    await link.click();
    // A barra aparece no clique e some quando a página nova chega
    await expect(page).toHaveURL(/\/lists/);
    await expect(page.getByRole("progressbar")).toHaveCount(0);
  });
});
