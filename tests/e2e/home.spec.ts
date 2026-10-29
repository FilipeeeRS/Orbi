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

  test("Novidades: filmes e séries mais aguardados com 'Ver tudo'", async ({ page }) => {
    await open(page, "/home");
    for (const [kind, browse] of [
      ["movie", "/browse/movies"],
      ["series", "/browse/series"],
    ] as const) {
      const heading = page.getByRole("heading", { name: t.home.mostAnticipated(t.folders[kind]) });
      await expect(heading).toBeVisible();
      const section = page.locator("section").filter({ has: heading });
      await expect(section.locator(`a[href^="/${kind === "movie" ? "movie" : "series"}/"]`).first()).toBeVisible();
      await expect(section.getByRole("link", { name: t.profile.all })).toHaveAttribute("href", `${browse}?sort=anticipated`);
    }
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

  test("aba Músicas mostra 'Em breve' no lugar de fileiras vazias", async ({ page }) => {
    await open(page, "/home?folder=music");
    await expect(page.getByText(t.folders.soon)).toBeVisible();
  });
});
