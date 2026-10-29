import { dictionaries, LOCALES } from "../../src/lib/i18n/dictionaries";
import { expect, open, t, test } from "./support";

test.describe("Idiomas", () => {
  test("trocar o idioma no rodapé muda a página (e volta para o português)", async ({ page }) => {
    await open(page, "/home");
    const select = page.locator("footer").getByRole("combobox", { name: t.footer.language });
    await select.selectOption("en");
    await expect(page.locator("main h1")).toHaveText(dictionaries.en.home.welcomeSub);
    await expect(page.locator("html")).toHaveAttribute("lang", dictionaries.en.htmlLang);
    await page.locator("footer").getByRole("combobox", { name: dictionaries.en.footer.language }).selectOption("pt");
    await expect(page.locator("main h1")).toHaveText(t.home.welcomeSub);
  });

  // Cada idioma abre a Home com os textos dele, o lang certo e a direção certa (árabe e urdu: direita→esquerda).
  for (const locale of LOCALES) {
    test(`Home em ${locale}`, async ({ page, context }) => {
      await context.addCookies([{ name: "orbi_locale", value: locale, url: test.info().project.use.baseURL ?? "http://localhost:3000" }]);
      await open(page, "/home");
      const d = dictionaries[locale];
      await expect(page.locator("main h1")).toHaveText(d.home.welcomeSub);
      await expect(page.locator("html")).toHaveAttribute("lang", d.htmlLang);
      await expect(page.locator("html")).toHaveAttribute("dir", d.dir);
      // O título da aba do navegador também no idioma
      await open(page, "/lists");
      await expect(page).toHaveTitle(new RegExp(d.lists.allTitle));
    });
  }
});
