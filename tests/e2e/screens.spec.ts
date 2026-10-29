import { discoverList, expect, open, PUBLIC_ROUTES, test } from "./support";

// Fotos de página inteira de todas as telas, no computador e no celular, para ver o site de uma vez.
// Rodar com: npm run test:screens. As imagens vão para tests/e2e/screens-output/<desktop|mobile>/
// e também ficam no relatório (npm run test:report).
test.describe("Fotos das telas", () => {
  test.describe.configure({ mode: "parallel" });

  async function shoot(page: import("@playwright/test").Page, name: string, path: string) {
    await open(page, path);
    await expect(page.locator("main h1").first()).toBeVisible();
    // Espera as seções que carregam à parte e as imagens da primeira tela
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    const file = `tests/e2e/screens-output/${test.info().project.name}/${name}.png`;
    const shot = await page.screenshot({ path: file, fullPage: true });
    await test.info().attach(name, { body: shot, contentType: "image/png" });
  }

  for (const route of PUBLIC_ROUTES) {
    test(route.name, async ({ page }) => {
      await shoot(page, route.name, route.path);
    });
  }

  test("perfil-e-lista", async ({ page, request }) => {
    const found = await discoverList(request);
    test.skip(!found, "nenhuma lista no banco");
    await shoot(page, "perfil", `/u/${found!.username}`);
    await shoot(page, "perfil-filmes", `/u/${found!.username}/movies`);
    await shoot(page, "perfil-listas", `/u/${found!.username}/all?tab=lists`);
    await shoot(page, "lista", found!.listPath);
  });
});
