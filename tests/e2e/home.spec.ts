import { expect, open, t, test } from "./support";
import { MEDIA_KINDS } from "../../src/lib/types";

const tabName = (key: string) => (key === "news" ? t.home.newsTab : t.folders[key as keyof typeof t.folders] as string);

test.describe("Home", () => {
  test("visitante vê boas-vindas, as abas e o convite para entrar", async ({ page }) => {
    await open(page, "/home");
    await expect(page.locator("main h1").first()).toHaveText(t.home.welcomeSub);
    for (const key of ["news", ...MEDIA_KINDS]) {
      await expect(page.getByRole("link", { name: tabName(key), exact: true }).first()).toBeVisible();
    }
    // Novidades aberta por padrão
    await expect(page.getByRole("link", { name: t.home.newsTab })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(t.home.guestNews)).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: t.nav.signIn })).toHaveAttribute("href", "/login");
  });

  test("trocar de aba muda o endereço e a aba marcada", async ({ page }) => {
    await open(page, "/home");
    for (const key of MEDIA_KINDS) {
      await page.getByRole("link", { name: tabName(key), exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`folder=${key}`));
      await expect(page.getByRole("link", { name: tabName(key), exact: true }).first()).toHaveAttribute("aria-current", "page");
    }
    await page.getByRole("link", { name: t.home.newsTab }).click();
    await expect(page.getByRole("link", { name: t.home.newsTab })).toHaveAttribute("aria-current", "page");
  });

  test("Novidades: uma linha só de mais aguardados, misturando as pastas", async ({ page }) => {
    await open(page, "/home");
    const heading = page.getByRole("heading", { name: t.movies.sortOrder.anticipated, exact: true });
    await expect(heading).toHaveCount(1);
    const section = page.locator("section").filter({ has: heading });
    // Cada pôster leva para a página da obra na pasta dela
    const hrefs = await section.locator("a[href]").evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
    const folders = new Set(hrefs.map((h) => h.split("/")[1]));
    expect(folders.size).toBeGreaterThan(1);
    // As linhas antigas, uma por pasta, não existem mais
    await expect(page.getByRole("heading", { name: t.home.mostAnticipated(t.folders.movie) })).toHaveCount(0);
  });

  test("Novidades: listas e reviews populares", async ({ page }) => {
    await open(page, "/home");
    await expect(page.getByRole("heading", { name: t.home.popularLists })).toBeVisible();
    await expect(page.getByRole("heading", { name: t.home.popularReviews })).toBeVisible();
  });

  for (const kind of ["movie", "series", "book", "game"] as const) {
    test(`aba ${tabName(kind)}: populares, mais aguardados (se houver) e todos, com links que funcionam`, async ({ page }) => {
      await open(page, `/home?folder=${kind}`);
      await expect(page.getByRole("heading", { name: t.home.popular(t.folders[kind]) })).toBeVisible();
      await expect(page.getByRole("heading", { name: t.folders.allOf(t.folders[kind]) })).toBeVisible();
      if (kind !== "book") await expect(page.getByRole("heading", { name: t.home.mostAnticipated(t.folders[kind]) })).toBeVisible();
      // Todos os "Ver tudo" da aba levam para uma página que abre
      const links = await page.locator("main").getByRole("link", { name: t.profile.all }).evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
      expect(links.length).toBeGreaterThan(0);
      for (const href of links) {
        const response = await page.request.get(href, { timeout: 120_000 }); // algumas fontes (Steam) demoram
        expect(response.status(), href).toBeLessThan(400);
      }
    });
  }

  test("Músicas fica escondida até ficar pronta (sem aba e sem link)", async ({ page }) => {
    await open(page, "/home");
    await expect(page.getByRole("link", { name: t.folders.music, exact: true })).toHaveCount(0);
    await expect(page.locator('a[href*="folder=music"], a[href="/browse/music"]')).toHaveCount(0);
  });
});
