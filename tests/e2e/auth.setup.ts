import { test as setup, expect } from "@playwright/test";
import { pt as t } from "../../src/lib/i18n/locales/pt";
import { AUTH_FILE } from "../../playwright.config";

// Entra com a conta de teste (E2E_EMAIL e E2E_PASSWORD do .env.local) e guarda a sessão para os
// testes de quem está logado. A conta deve ser só de teste e estar em português (o padrão).
setup("entrar com a conta de teste", async ({ page }) => {
  await page.goto("/login?next=/home");
  await page.locator('form input[name="email"]').fill(process.env.E2E_EMAIL!);
  await page.locator('form input[name="password"]').fill(process.env.E2E_PASSWORD!);
  await page.locator('form input[name="password"]').press("Enter");
  await expect(page).toHaveURL(/\/home/);
  // Logado: a Home dá boas-vindas pelo nome e mostra as notificações
  await expect(page.getByRole("heading", { name: t.notifications.title })).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
