<div align="center">

# 🪐 Orbi

Social diary for movies, series, anime, manga, books and games, inspired by Letterboxd. Users log what they've watched, read or played, rate and review titles, build lists and follow friends' activity.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

## Features

| Media | Source | Highlights |
| --- | --- | --- |
| Movies | TMDB | cast, crew, releases, where to watch, recommendations |
| Series | TMDB | per-episode ratings, episode progress tracking |
| Anime | AniList | one entry per season, related titles |
| Manga | AniList | chapters, volumes, anime adaptations |
| Books | Open Library | authors, pages, reading status |
| Games | Steam | developer, platforms, play status |

- Per-title status, half-star ratings, reviews with threaded comments and notifications
- Custom lists, favorites, user profiles and friends' activity feed
- Letterboxd import (diary, ratings, reviews and watchlist)
- Typo-tolerant search with live suggestions, filters by decade, genre and rating
- 16 languages, including right-to-left support, plus light and dark themes

## Stack

- **Next.js 16** (App Router, Cache Components, `"use cache"`) and **React 19**
- **Supabase**: Postgres with Row Level Security, authentication (email, username or Google) and Storage
- **Tailwind CSS 4**
- **pg_trgm** for fuzzy search directly in the database
- Handmade UI components, no UI libraries

## Running locally

```bash
npm install
```

Create a `.env.local` file at the root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...   # server only
TMDB_API_KEY=...
CRON_SECRET=a-random-string         # protects /api/sync/* routes
```

Run the migrations in `supabase/migrations/` in order (SQL Editor or `supabase db push`), then:

```bash
npm run dev
```

Optionally, sync the AniList catalog into the database for faster listings:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/sync/anilist?type=anime&mode=full&pages=50"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/sync/anilist?type=manga&mode=full&pages=50"
```

## Project structure

```
src/
├── app/            routes: title pages, browse, search, profiles, API
├── components/     poster, review editor, filters
└── lib/            source clients, catalog cache, queries, i18n
supabase/
└── migrations/     schema, RLS policies and functions
```

## Data sources

TMDB, AniList, Open Library, Steam and JustWatch (via TMDB).

This product uses the TMDB API but is not endorsed or certified by TMDB.
