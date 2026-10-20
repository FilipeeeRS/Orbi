<div align="center">

# 🪐 Orbi

**Listas para tudo.** Tudo o que você assiste, ouve, joga e lê, em um só lugar.

Um diário social no estilo do Letterboxd, só que para **filmes, séries, animes, mangás, livros e jogos**:
registre o que viu, dê nota com meia estrela, escreva reviews, monte listas e acompanhe o que seus amigos andam curtindo.

[Funcionalidades](#-funcionalidades) · [Stack](#-stack) · [Rodando localmente](#-rodando-localmente) · [Fontes de dados](#-fontes-de-dados) · [Estrutura](#-estrutura)

</div>

---

## ✨ Funcionalidades

### Catálogo de tudo

| Pasta | Fonte | O que dá para fazer |
| --- | --- | --- |
| 🎬 Filmes | TMDB | ficha completa (elenco, equipe, lançamentos, onde assistir), trailer, recomendações |
| 📺 Séries | TMDB | tabela de notas por episódio, lista de episódios com "próximo episódio", "Parei em" |
| ⛩️ Animes | AniList | cada temporada é um anime (como no MyAnimeList), temporada atual, relacionados |
| 📖 Mangás | AniList | capítulos, volumes, autores e adaptações em anime |
| 📚 Livros | Open Library | autores, páginas, assuntos, "Ler / Lido / Lendo" |
| 🎮 Jogos | Steam | desenvolvedora, plataformas, "Jogar / Jogado / Jogando" |
| 🎵 Músicas | — | em breve |

### Seu diário

- **Status** por obra: visto, assistindo/lendo/jogando e watchlist, com nota de ½ a 5 estrelas, like e review com anexos
- **Reviews sociais**: curtidas, comentários com respostas e notificações
- **Atividade dos amigos** em cada obra e na Home
- **Listas personalizadas** e **favoritos** no perfil
- **Perfil** com capa, anel no avatar, sticker, diário, distribuição de notas e cartão para compartilhar
- **Importação do Letterboxd** (diário, notas, likes, reviews e watchlist)

### Descoberta

- **Home com abas**: Novidades e uma aba por pasta (populares da semana, sua prateleira e o melhor de cada catálogo)
- **Busca com sugestões** enquanto digita, tolerante a erro de digitação ("breking bad", "atack on titan")
- **Busca "Tudo"** com um tópico por tipo, e fichas clicáveis: ator, diretor, estúdio, gênero ou país levam a tudo em que aparecem
- **Ordenação por tópicos** (como no Letterboxd) e filtros por década, gênero e nota

### Para o mundo todo

- **16 idiomas** (incluindo árabe e urdu, da direita para a esquerda), com títulos e sinopses traduzidos
- Temas claro e escuro, cores de destaque e conteúdo +18 opcional

---

## 🧱 Stack

- **[Next.js 16](https://nextjs.org)** (App Router, Cache Components, `"use cache"`) e **React 19**
- **[Supabase](https://supabase.com)**: Postgres com RLS, autenticação (e-mail, usuário ou Google) e Storage
- **Tailwind CSS 4**
- `pg_trgm` para a busca tolerante a erro no próprio banco

Sem bibliotecas de UI: os componentes são feitos à mão.

---

## 🚀 Rodando localmente

### 1. Dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Crie um `.env.local` na raiz:

```bash
# Supabase: Project Settings > API Keys
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...   # só no servidor: grava o catálogo

# TMDB: themoviedb.org > Settings > API (Read Access Token v4 ou API key v3)
TMDB_API_KEY=...

# Protege as rotas de sincronização do catálogo (/api/sync/...)
CRON_SECRET=uma-string-aleatória
```

AniList, Open Library e Steam não precisam de chave.

### 3. Banco de dados

Rode os arquivos de `supabase/migrations/` em ordem no **SQL Editor** do Supabase (ou `supabase db push` com o CLI).

### 4. Subir

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### 5. (Opcional) Cópia do catálogo de animes e mangás

As listagens de anime e mangá funcionam direto da API do AniList, mas ficam mais rápidas e sem limite com a cópia no banco:

```bash
# carga completa (repita até "done": true)
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/sync/anilist?type=anime&mode=full&pages=50"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/sync/anilist?type=manga&mode=full&pages=50"

# depois, uma vez por dia (agendador do Vercel ou do Supabase)
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/sync/anilist?mode=recent"
```

---

## 📡 Fontes de dados

| Fonte | Uso |
| --- | --- |
| [TMDB](https://www.themoviedb.org) | filmes e séries |
| [AniList](https://anilist.co) | animes e mangás (com o id do MyAnimeList) |
| [Open Library](https://openlibrary.org) | livros |
| [Steam](https://store.steampowered.com) | jogos |
| [JustWatch](https://www.justwatch.com) (via TMDB) | onde assistir |

> Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
> Uso comercial exige licença ou acordo com cada fonte.

O catálogo é salvo no banco conforme as obras são abertas ou marcadas (e, para animes e mangás, pela sincronização), então as páginas não dependem da fonte a cada visita.

---

## 🗂️ Estrutura

```
src/
├── app/                    rotas (App Router)
│   ├── movie/ series/ anime/ manga/ book/ game/   página de cada obra
│   ├── browse/[folder]/    "Ver tudo" de cada pasta
│   ├── search/             busca (Tudo, por tipo, pessoas, gêneros...)
│   ├── u/[username]/       perfil, pastas, listas e cartão
│   ├── api/                sugestões, importação e sincronização
│   └── home-dashboard.tsx  Home com abas
├── components/             pôster, editor de nota/review, ficha, filtros...
└── lib/
    ├── tmdb.ts anilist.ts openlibrary.ts steam.ts   clientes das fontes
    ├── catalog.ts          garante cada obra no banco
    ├── queries.ts home.ts  consultas do diário e da Home
    └── i18n/locales/       os 16 idiomas
supabase/migrations/        esquema, políticas (RLS) e funções
```

---

<div align="center">

Feito com ☕ por [Filipe](https://github.com/FilipeeeRS)

</div>
