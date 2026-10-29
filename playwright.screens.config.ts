import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

// Fotos de todas as telas (computador e celular), para ver o site sem abrir página por página.
// Rodar com: npm run test:screens — as imagens ficam em tests/e2e/screens-output/ e no relatório.
export default defineConfig({
  ...base,
  retries: 0,
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], locale: "pt-BR" }, testMatch: /screens\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], locale: "pt-BR" }, testMatch: /screens\.spec\.ts/ },
  ],
});
