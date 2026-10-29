import type { Locator, Page } from "@playwright/test";
import { discoverList, expect, open, t, test } from "./support";

// Testes de quem está logado (conta de teste do .env.local). Cada teste desfaz o que fez: a conta
// termina como começou (sem nota, watchlist, like, lista ou comentário a mais).
test.describe.configure({ mode: "serial" });

// O @ da conta de teste, pelo link "Perfil" do menu da foto.
async function myUsername(page: Page) {
  await open(page, "/home");
  await page.locator('header button[aria-haspopup="menu"]').click();
  const href = await page.getByRole("menuitem", { name: t.profile.tab, exact: true }).getAttribute("href");
  await page.keyboard.press("Escape");
  return href!.replace("/u/", "");
}

const pressed = (l: Locator) => expect(l).toHaveAttribute("aria-pressed", "true");
const notPressed = (l: Locator) => expect(l).toHaveAttribute("aria-pressed", "false");

test.describe("Logado", () => {
  test("Home: boas-vindas pelo nome, watchlist e o botão Registrar no topo", async ({ page }) => {
    await open(page, "/home");
    await expect(page.locator("main h1")).toContainText(t.home.welcome("").replace(/!$/, "").trim());
    await expect(page.getByRole("heading", { name: t.home.yourWatchlist })).toBeVisible();
    await expect(page.getByText(t.home.guestNews)).toHaveCount(0);
    await expect(page.locator("header").getByRole("button", { name: t.quickLog.button })).toBeVisible();
  });

  test("Registrar rápido: busca, nota, salva, aviso com 'Ver' e desfaz pela página da obra", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await open(page, "/home");
    await page.locator("header").getByRole("button", { name: t.quickLog.button }).click();
    const dialog = page.getByRole("dialog", { name: t.quickLog.title });
    await dialog.getByPlaceholder(t.quickLog.search).fill("The Matrix");
    await dialog.locator("ul button").first().click();
    await dialog.getByRole("radio", { name: "4", exact: true }).click();
    await dialog.getByRole("button", { name: t.movie.save }).click();
    // Aviso "… registrado" com o atalho "Ver"
    const toast = page.getByRole("status").filter({ hasText: t.quickLog.view });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: t.quickLog.view }).click();
    await expect(page.getByRole("radio", { name: "4", exact: true })).toHaveAttribute("aria-checked", "true");
    // Desfaz: tira o "visto" (apaga a nota)
    await page.getByRole("button", { name: new RegExp(`^(${t.movie.watched}|${t.manga.readDone}|${t.game.played})$`) }).first().click();
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  });

  test("pôster: o atalho mostra o aviso com 'Desfazer', e desfazer volta ao que era", async ({ page }) => {
    await open(page, "/browse/movies");
    const card = page.locator("main .group").filter({ has: page.locator('a[href^="/movie/"]') }).nth(1);
    await card.hover();
    const watchlist = card.getByRole("button", { name: t.movies.tabs.watchlist });
    const before = await watchlist.getAttribute("aria-pressed");
    await watchlist.click();
    const toast = page.getByRole("status").filter({ hasText: t.toast.undo });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: t.toast.undo }).click();
    await expect(watchlist).toHaveAttribute("aria-pressed", before!);
    await page.waitForTimeout(1500);
  });

  test("busca de pessoas e 'Quem seguir'", async ({ page }) => {
    await open(page, "/search?type=people");
    await expect(page.locator("main h1")).toContainText(t.people.find);
    await expect(page.getByText(t.people.prompt)).toBeVisible();
  });

  test("menu da foto: Seus filmes, Seu tudo, notificações, configurações e sair", async ({ page }) => {
    await open(page, "/home");
    await page.locator('header button[aria-haspopup="menu"]').click();
    const menu = page.getByRole("menu");
    for (const name of [t.folders.yours.movie, t.folders.yours.series, t.folders.yourAll, t.nav.notifications, t.nav.settings]) {
      await expect(menu.getByRole("menuitem", { name, exact: true })).toBeVisible();
    }
    await menu.getByRole("menuitem", { name: t.folders.yours.movie, exact: true }).click();
    await expect(page.locator("main h1")).toContainText(t.folders.yours.movie);
  });

  test("filme: watchlist liga, fica salva e desliga", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await open(page, "/movie/603");
    const watchlist = page.getByRole("button", { name: t.movies.tabs.watchlist, exact: true });
    const watched = page.getByRole("button", { name: new RegExp(`^(${t.movie.watch}|${t.movie.watched})$`) }).first();
    // Começa limpo (se um teste anterior parou no meio)
    if ((await watched.getAttribute("aria-pressed")) === "true") await watched.click();
    await page.mouse.move(0, 0);
    if ((await watchlist.getAttribute("aria-pressed")) === "true") await watchlist.click();
    await page.mouse.move(0, 0);
    await notPressed(watchlist);

    await watchlist.click();
    await page.mouse.move(0, 0); // com o mouse em cima, o botão mostra "Remover"
    await pressed(watchlist);
    await page.waitForTimeout(1500); // a gravação vai em fila
    await page.reload();
    await pressed(page.getByRole("button", { name: t.movies.tabs.watchlist, exact: true }));
    await page.getByRole("button", { name: t.movies.tabs.watchlist, exact: true }).click();
    await page.mouse.move(0, 0);
    await notPressed(page.getByRole("button", { name: t.movies.tabs.watchlist, exact: true }));
    await page.waitForTimeout(1500);
    await page.reload();
    await notPressed(page.getByRole("button", { name: t.movies.tabs.watchlist, exact: true }));
  });

  test("filme: dar nota marca como visto; tirar o visto apaga a nota", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await open(page, "/movie/603");
    const star = page.getByRole("radio", { name: "4", exact: true });
    await star.click();
    await expect(star).toHaveAttribute("aria-checked", "true");
    await pressed(page.getByRole("button", { name: t.movie.watched, exact: true }));
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByRole("radio", { name: "4", exact: true })).toHaveAttribute("aria-checked", "true");
    // Tira o "Assistido" (pede confirmação porque tem nota) e confere que limpou
    await page.getByRole("button", { name: t.movie.watched, exact: true }).click();
    await notPressed(page.getByRole("button", { name: t.movie.watch, exact: true }));
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  });

  test("pôster: curtir pelo atalho ao passar o mouse e descurtir", async ({ page }) => {
    await open(page, "/browse/movies");
    const card = page.locator("main .group").filter({ has: page.locator('a[href^="/movie/"]') }).first();
    await card.hover();
    const like = card.getByRole("button", { name: new RegExp(`^(${t.movie.like}|${t.movie.liked})$`) });
    const startLiked = (await like.getAttribute("aria-pressed")) === "true";
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", startLiked ? "false" : "true");
    await page.waitForTimeout(1000);
    await card.hover();
    await like.click(); // volta ao que era
    await expect(like).toHaveAttribute("aria-pressed", startLiked ? "true" : "false");
    await page.waitForTimeout(1500);
  });

  test("lista: criar com um filme, curtir, salvar, comentar, apagar comentário e apagar a lista", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    const me = await myUsername(page);
    await open(page, `/u/${me}/all?tab=lists`);
    await page.getByRole("button", { name: t.lists.new }).click();
    const dialog = page.getByRole("dialog", { name: t.lists.new });
    const name = `Teste E2E ${Date.now()}`;
    await dialog.getByPlaceholder(t.lists.namePlaceholder).fill(name);
    await dialog.getByPlaceholder(t.lists.searchPlaceholder).fill("Matrix");
    await dialog.locator("ul button").first().click();
    await expect(dialog.getByText(t.lists.count(1))).toBeVisible();
    await dialog.getByRole("button", { name: t.lists.create }).click();

    // Abre a página da lista nova
    await expect(page).toHaveURL(new RegExp(`/u/${me}/list/`));
    await expect(page.locator("main h1")).toContainText(name);

    // Curtir e salvar (o marcador precisa da tabela list_saves no banco)
    const like = page.locator(`main button[title="${t.lists.like}"]`); // o ♥ mostra o número: acha pelo título
    await like.click();
    await pressed(like);
    const save = page.getByRole("button", { name: new RegExp(`^(${t.lists.saveList}|${t.lists.savedList})$`) });
    await save.click();
    await pressed(save);

    // Comentar e apagar o comentário
    const text = `comentário de teste ${Date.now()}`;
    await page.getByPlaceholder(t.comments.placeholder).fill(text);
    await page.getByRole("button", { name: t.comments.send }).click();
    const comment = page.locator("#comments li").filter({ hasText: text });
    await expect(comment).toBeVisible();
    await comment.getByRole("button", { name: t.report.more }).click();
    await comment.getByRole("button", { name: t.comments.delete }).click();
    await expect(comment).toHaveCount(0);

    // Apagar a lista
    await page.getByRole("button", { name: t.lists.edit }).click();
    await page.getByRole("dialog", { name: t.lists.edit }).getByRole("button", { name: t.lists.delete }).click();
    await expect(page).toHaveURL(new RegExp(`/u/${me}/all\\?tab=lists`));
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test("denunciar a lista de outra pessoa abre a janela com os motivos (e cancela)", async ({ page, request }) => {
    const me = await myUsername(page);
    const found = await discoverList(request);
    test.skip(!found || found.username === me, "sem lista de outra pessoa para testar");
    await open(page, found!.listPath);
    await page.getByRole("button", { name: t.report.more }).first().click();
    await page.getByRole("button", { name: t.report.report }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(t.report.why)).toBeVisible();
    for (const reason of Object.values(t.report.reasons)) await expect(dialog.getByText(reason)).toBeVisible();
    // Sem motivo escolhido não dá para enviar
    await expect(dialog.getByRole("button", { name: t.report.send })).toBeDisabled();
    await dialog.getByRole("button", { name: t.report.cancel }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("notificações: abas, marcar como lida e não lida, apagar e ver em Apagadas", async ({ page }) => {
    await open(page, "/notifications");
    await expect(page.locator("main h1")).toContainText(t.notifications.title);
    for (const tab of Object.values(t.notifications.filters).filter((v) => v !== t.notifications.filters.updates)) {
      await expect(page.locator("main").getByRole("link", { name: new RegExp(`^${tab}`) })).toBeVisible();
    }
    // Toda conta tem pelo menos a de boas-vindas
    const first = page.locator("main ul > li").first();
    await expect(first).toBeVisible();
    const check = first.getByRole("button", { name: new RegExp(`^(${t.notifications.markRead}|${t.notifications.markUnread})$`) });
    const before = await check.getAttribute("aria-pressed");
    await check.click();
    await expect(check).not.toHaveAttribute("aria-pressed", before!);
    await check.click();
    await expect(check).toHaveAttribute("aria-pressed", before!);
    // Apagar: some daqui e aparece em Apagadas (os cookies desta sessão de teste não ficam na conta)
    const text = (await first.innerText()).split("\n")[0];
    await first.getByRole("button", { name: t.notifications.delete }).click();
    await page.locator("main").getByRole("link", { name: new RegExp(`^${t.notifications.filters.deleted}`) }).click();
    await expect(page).toHaveURL(/type=deleted/);
    await expect(page.locator("main ul > li").filter({ hasText: text }).first()).toBeVisible();
  });

  test("configurações e importar abrem", async ({ page }) => {
    await open(page, "/settings");
    await expect(page.locator("main h1")).toContainText(t.settings.title);
    await open(page, "/import");
    await expect(page.locator("main h1")).toContainText(t.import.title);
  });
});
