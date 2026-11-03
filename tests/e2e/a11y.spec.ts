import AxeBuilder from "@axe-core/playwright";
import { test, expect, t, open, PUBLIC_ROUTES } from "./support";

// Acessibilidade: o axe confere cada tela pública pelas regras WCAG 2.1 A e AA (nomes, rótulos,
// estrutura, contraste, idioma...). Só problemas sérios ou críticos reprovam.
for (const route of PUBLIC_ROUTES) {
  test(`${route.name} (${route.path}) passa no axe`, async ({ page }) => {
    await open(page, route.path);
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Pôsteres e capas vêm de fora; o texto deles não é nosso
      .exclude("img")
      .analyze();
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.help} (${v.nodes.length}x) → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    expect(serious, `problemas de acessibilidade em ${route.path}`).toEqual([]);
  });
}

// Teclado: dá para chegar em tudo e usar as janelas sem mouse.
test.describe("Só com teclado", () => {
  test("o primeiro Tab mostra onde está o foco", async ({ page }) => {
    await open(page, "/home");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el && el !== document.body ? getComputedStyle(el).outlineStyle : "none";
    });
    expect(outline).not.toBe("none");
  });

  test("filtro abre com Enter, anda com Tab e fecha com Esc", async ({ page }) => {
    await open(page, "/browse/movies");
    const genre = page.getByRole("button", { name: t.movies.filters.genre }).filter({ visible: true }).first();
    const menu = page.locator("main ul button").first();
    // Repete até a página terminar de carregar (antes disso o botão ainda não responde)
    await expect(async () => {
      await genre.focus();
      await page.keyboard.press("Enter");
      await expect(menu).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("busca do topo: digita, desce com a seta e abre com Enter", async ({ page }) => {
    await open(page, "/home");
    const search = page.getByRole("combobox").first();
    await search.focus();
    await search.fill("matrix");
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).not.toHaveURL(/\/home$/);
  });

  test("trailer abre com Enter, fecha com Esc e o foco volta para o botão", async ({ page }) => {
    await open(page, "/movie/603");
    const trailer = page.getByRole("button", { name: t.movie.trailer }).filter({ visible: true }).first();
    test.skip((await trailer.count()) === 0, "sem trailer para este filme");
    const dialog = page.getByRole("dialog");
    await expect(async () => {
      await trailer.focus();
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 60_000 });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trailer).toBeFocused();
  });
});

// Contraste em todos os temas: o tema fica no navegador (localStorage), então é escolhido antes de abrir.
const THEMES = ["dark", "light", "fire-dark", "fire-light", "ocean-dark", "ocean-light", "purple-dark", "purple-light", "forest-dark", "forest-light", "sunset-dark", "sunset-light", "pink-dark", "pink-light"];
const THEME_PAGES = ["/home", "/movie/603", "/lists", "/login"];

for (const theme of THEMES) {
  test(`tema ${theme}: textos com contraste suficiente`, async ({ page }) => {
    await page.addInitScript((name) => localStorage.setItem("orbi-theme", name), theme);
    const problems: string[] = [];
    for (const path of THEME_PAGES) {
      await open(page, path);
      await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const { violations } = await new AxeBuilder({ page }).withRules(["color-contrast"]).exclude("img").analyze();
      for (const v of violations)
        for (const n of v.nodes.slice(0, 4)) problems.push(`${path}: ${n.target.join(" ")} — ${n.any[0]?.message ?? v.help}`);
    }
    expect(problems, `contraste baixo no tema ${theme}`).toEqual([]);
  });
}
