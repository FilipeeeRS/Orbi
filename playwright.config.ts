import { defineConfig, devices } from "@playwright/test";

// Testes de ponta a ponta (Playwright): abrem o site num navegador de verdade e clicam como uma pessoa.
// Lê o .env.local (E2E_EMAIL e E2E_PASSWORD da conta de teste, PLAYWRIGHT_BASE_URL opcional).
try {
  process.loadEnvFile(".env.local");
} catch {
  // sem .env.local: só os testes de visitante
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
// Com a conta de teste no .env.local, entram também os testes de quem está logado.
const loggedIn = !!(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);
export const AUTH_FILE = "tests/e2e/.auth/user.json";

export default defineConfig({
  testDir: "tests/e2e",
  // O servidor de desenvolvimento monta cada página na hora: tempos folgados.
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: true,
  workers: 2,
  retries: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    locale: "pt-BR", // os textos conferidos são os do dicionário em português
    navigationTimeout: 90_000,
    actionTimeout: 20_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Usa o servidor que já estiver rodando; se não houver, sobe o "npm run dev" (no GitHub, o site
  // já compilado: "npm run start", bem mais rápido).
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    // Computador: todos os testes de visitante.
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], locale: "pt-BR" },
      testIgnore: [/logged-in\.spec\.ts/, /auth\.setup\.ts/, /screens\.spec\.ts/],
    },
    // Celular: só os marcados com @mobile (páginas abrindo, nada estourando para os lados).
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], locale: "pt-BR" },
      grep: /@mobile/,
      testIgnore: [/logged-in\.spec\.ts/, /auth\.setup\.ts/, /screens\.spec\.ts/],
    },
    ...(loggedIn
      ? [
          { name: "setup", testMatch: /auth\.setup\.ts/ },
          {
            name: "logged-in",
            testMatch: /logged-in\.spec\.ts/,
            dependencies: ["setup"],
            use: { ...devices["Desktop Chrome"], locale: "pt-BR", storageState: AUTH_FILE },
          },
        ]
      : []),
  ],
});
