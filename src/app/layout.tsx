import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { Header } from "@/components/header";
import { I18nProvider } from "@/components/i18n";
import { LocaleSwitch } from "@/components/locale-switch";
import { themeScript } from "@/components/theme-toggle";
import { getDict, getViewer } from "@/lib/session";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["700", "800"] });

export const metadata: Metadata = {
  title: { default: "Orbi", template: "%s · Orbi" },
  description: "Filmes, séries, músicas, jogos e livros em um só lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={<div className="h-16 border-b border-border" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}

// Idioma e usuário dependem da requisição (cookies), então ficam dentro do Suspense.
async function AppShell({ children }: { children: React.ReactNode }) {
  await connection(); // o cliente do Supabase lê a hora atual (validade da sessão)
  const [viewer, { locale, t }] = await Promise.all([getViewer(), getDict()]);

  return (
    <I18nProvider locale={locale}>
      <Header viewer={viewer} t={t} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 text-xs text-muted">
          <a href="https://www.themoviedb.org" className="max-w-md hover:text-fg" target="_blank" rel="noreferrer">
            {t.footer.tmdb}
          </a>
          <LocaleSwitch />
        </div>
      </footer>
    </I18nProvider>
  );
}
