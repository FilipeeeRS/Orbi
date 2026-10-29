import { expect, open, t, test } from "./support";

const TABS = [
  ["movie", t.folders.movie],
  ["series", t.folders.series],
  ["book", t.folders.book],
  ["anime", t.folders.anime],
  ["manga", t.folders.manga],
  ["game", t.folders.game],
] as const;

test.describe("Busca", () => {
  test("sugestões aparecem enquanto digita e Enter abre a busca", async ({ page }) => {
    await open(page, "/home");
    const box = page.locator("header").getByRole("combobox");
    await box.fill("batman");
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByRole("option").first()).toBeVisible();
    await box.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=batman/);
    await expect(page.locator("main h1")).toHaveText(t.search.title("batman"));
  });

  test("a tecla / leva para a busca do topo", async ({ page }) => {
    await open(page, "/browse/movies");
    const box = page.locator("header").getByRole("combobox");
    // Até a página ficar interativa a tecla ainda não faz nada: tenta de novo
    await expect(async () => {
      await page.locator("main h1").click();
      await page.keyboard.press("/");
      await expect(box).toBeFocused({ timeout: 1000 });
    }).toPass({ timeout: 60_000 });
  });

  test("aba Tudo mostra um tópico por tipo, com 'Ver tudo' para a aba dele", async ({ page }) => {
    await open(page, "/search?q=batman");
    await expect(page.getByRole("link", { name: t.folders.all, exact: true })).toHaveAttribute("aria-current", "page");
    const movies = page.locator("section").filter({ has: page.getByRole("heading", { name: t.folders.movie, exact: true }) });
    await expect(movies).toBeVisible();
    await movies.getByRole("link", { name: t.profile.all }).click();
    await expect(page).toHaveURL(/type=movie/);
    await expect(page.locator('main a[href^="/movie/"]').first()).toBeVisible();
  });

  for (const [type, label] of TABS) {
    test(`aba ${label} abre marcada e com resultados`, async ({ page }) => {
      const q = type === "book" ? "harry potter" : type === "game" ? "portal" : type === "anime" || type === "manga" ? "naruto" : "batman";
      await open(page, `/search?q=${encodeURIComponent(q)}&type=${type}`);
      await expect(page.locator("main").getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(`main a[href^="/${type}/"]`).first()).toBeVisible();
    });
  }

  test("filtros da busca (ordenar) mudam o endereço", async ({ page }) => {
    await open(page, "/search?q=batman&type=movie");
    await page.getByRole("button", { name: new RegExp(t.movies.filters.sortBy) }).click();
    await page.getByRole("button", { name: t.movies.sortOrder.az, exact: true }).click();
    await expect(page).toHaveURL(/sort=title/);
  });

  test("busca vazia pede para digitar", async ({ page }) => {
    await open(page, "/search");
    await expect(page.getByText(t.search.prompt)).toBeVisible();
  });

  test("busca sem resultado avisa", async ({ page }) => {
    await open(page, "/search?q=zzqqxxnaoexiste123&type=movie");
    await expect(page.getByText(t.search.empty)).toBeVisible();
  });
});
