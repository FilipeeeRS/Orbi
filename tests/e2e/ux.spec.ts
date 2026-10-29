import { discoverList, expect, open, t, test } from "./support";

// Recursos de experiência: página inicial, barra do celular, registrar rápido (visitante), pessoas.
test.describe("Experiência", () => {
  test("página inicial: mosaico, chamadas e os 4 recursos", async ({ page }) => {
    await open(page, "/");
    await expect(page.locator("main h1")).toHaveText(t.home.title);
    await expect(page.locator("main").getByRole("link", { name: t.home.cta })).toHaveAttribute("href", "/login");
    await expect(page.locator("main").getByRole("link", { name: t.home.explore })).toHaveAttribute("href", "/home");
    for (const f of t.landing.features) await expect(page.getByRole("heading", { name: f.title })).toBeVisible();
  });

  test("barra de baixo: aparece no celular e some no computador @mobile", async ({ page }, testInfo) => {
    await open(page, "/home");
    const bar = page.locator("nav").filter({ has: page.getByRole("button", { name: t.quickLog.button }) });
    if (testInfo.project.name === "mobile") {
      await expect(bar).toBeVisible();
      await expect(bar.getByRole("link", { name: t.nav.home })).toBeVisible();
      await expect(bar.getByRole("link", { name: t.footer.search })).toBeVisible();
      // Visitante: "+ Registrar" leva para o login
      await bar.getByRole("button", { name: t.quickLog.button }).click();
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(bar).toBeHidden();
    }
  });

  test("busca de pessoas acha um perfil pelo @ e leva até ele", async ({ page, request }) => {
    const found = await discoverList(request);
    test.skip(!found, "nenhum perfil conhecido");
    await open(page, `/search?q=${found!.username}&type=people`);
    await expect(page.locator("main").getByRole("link", { name: t.people.tab })).toHaveAttribute("aria-current", "page");
    const person = page.locator(`main a[href="/u/${found!.username}"]`).first();
    await expect(person).toBeVisible();
    await person.click();
    await expect(page).toHaveURL(new RegExp(`/u/${found!.username}$`));
  });

  test("página da obra no celular: o registro aparece antes do resumo @mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "só no celular");
    await open(page, "/movie/603");
    const signIn = page.getByRole("link", { name: t.movie.signInToLog });
    const overview = page.locator("main p.leading-relaxed").first();
    const [a, b] = await Promise.all([signIn.boundingBox(), overview.boundingBox()]);
    expect(a!.y).toBeLessThan(b!.y);
  });
});
