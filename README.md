# So'zlik

A Quizlet-style vocabulary app for Uzbek speakers: build word sets, study them with
flashcards, and master them with an adaptive **Learn** mode that shows the words you get wrong
more often. The interface is in Uzbek; code and comments are in English.

**Features:** email/username + password and Google sign-in · set editor with autosave,
drag-to-reorder and bulk import (paste or CSV) · public / password-protected / private sets ·
flashcards with 3D flip, swipe and keyboard shortcuts · adaptive Learn mode (multiple choice and
typed answers, typo tolerance, check-ins, summary) · profile with stats, weekly chart, streak
heatmap and hardest words · dark and light themes.

## Tech stack

Next.js 15 (App Router, Server Components, Server Actions) · React 19 · TypeScript (strict) ·
Tailwind CSS v4 + shadcn/ui (Radix) · Framer Motion · Prisma + PostgreSQL · Auth.js v5 ·
Zod + React Hook Form · TanStack Query · Zustand (Learn session only) · dnd-kit · recharts ·
sonner · next-themes · Vitest · pnpm.

## Getting started

Requirements: **Node.js 20+**, **pnpm 10.28+** (pnpm 11 and 12 work too) and a **PostgreSQL** database (local, Neon or Supabase).

```bash
# 1. Install dependencies (also generates the Prisma client)
pnpm install

# 2. Configure the environment
cp .env.example .env
#    then fill in DATABASE_URL, DIRECT_URL and AUTH_SECRET (see below)

# 3. Create the database tables
pnpm prisma migrate dev

# 4. Add demo data (optional)
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

Open <http://localhost:3000>. After seeding you can sign in as
**demo@sozlik.uz / demo12345** (username `demo`) and study the public set
"Kundalik so'zlar" (30 English → Uzbek words). Running the seed again restores that set.

### Environment variables

| Variable                                                               | Required | Purpose                                                                                                                                 |
| ---------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                         | yes      | PostgreSQL connection used by the app (the pooled URL on Neon/Supabase)                                                                 |
| `DIRECT_URL`                                                           | yes      | Direct, non-pooled connection used by migrations (same as `DATABASE_URL` locally)                                                       |
| `AUTH_SECRET`                                                          | yes      | Signs sessions and set-unlock cookies. Generate with `openssl rand -base64 32`                                                          |
| `AUTH_URL`                                                             | prod     | Public base URL, e.g. `https://sozlik.example.com`                                                                                      |
| `NEXT_PUBLIC_APP_URL`                                                  | prod     | Same URL, used for SEO / OpenGraph links                                                                                                |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`                                 | optional | Google sign-in. Redirect URI: `<AUTH_URL>/api/auth/callback/google`                                                                     |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                   | optional | Rate limiting across server instances. Without them an in-memory limiter is used (fine for development and single-instance deployments) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | optional | Avatar uploads (signed, direct from the browser). Without them the upload button is hidden                                              |

## Scripts

| Command                     | What it does                                   |
| --------------------------- | ---------------------------------------------- |
| `pnpm dev`                  | Development server                             |
| `pnpm build` / `pnpm start` | Production build / server                      |
| `pnpm lint`                 | ESLint                                         |
| `pnpm typecheck`            | `tsc --noEmit`                                 |
| `pnpm test`                 | Vitest unit tests (`pnpm test:watch` to watch) |
| `pnpm format`               | Prettier (with Tailwind class sorting)         |
| `pnpm db:migrate`           | `prisma migrate dev`                           |
| `pnpm db:seed`              | Demo user and set                              |
| `pnpm db:studio`            | Prisma Studio                                  |

## Project structure

```
prisma/
  schema.prisma          users, sets, cards, card progress, study sessions, favorites
  seed.ts                demo user + "Kundalik so'zlar"
src/
  app/(marketing)/       landing page
  app/(auth)/            login, register (+ server actions)
  app/(app)/             dashboard, library, profile, sets/{new,[id],[id]/edit,flashcards,learn}
  components/            ui (shadcn), flashcard, learn, set-editor, import-dialog, charts, …
  lib/learning/          adaptive learning algorithm (framework-independent, fully tested)
  lib/validators/        Zod schemas (Uzbek error messages)
  lib/queries/           server-only data access with authorization checks
  lib/import-parser.ts   paste / CSV import parser
  stores/learn-store.ts  Zustand store for a Learn session
  middleware.ts          route protection
```

## How Learn mode works

Each user has a progress record per card: a Leitner-style **box** (0–4), a selection **weight**,
a correct-answer **streak** and counters.

- **Correct:** streak +1, weight × 0.6 (min 0.2); from the 2nd correct answer in a row the card
  moves up a box.
- **Wrong** (or "Bilmayman?"): streak resets, the card moves down a box, weight × 2 + 0.5 (max 8).
- **Mastery:** box 0–2 → new / learning, box 3 → familiar, box 4 with a streak of 3+ → mastered.
- **Picking the next card:** score = weight × recency × due-ness (× 1.5 for words with > 40%
  errors), then weighted random choice. The last three cards are never repeated, a wrong card
  returns 3–5 questions later, new words arrive in batches of 7, and mastered words come back
  only occasionally for review.
- New and learning words are asked as multiple choice; familiar words must be typed (one typo
  allowed in words of 5+ letters).

Every answer is saved through a Server Action that applies the same rules on the server, so a
session can be resumed at any time.

## Notes

- All write operations are Server Actions that validate input with Zod and check ownership or
  access on the server. Password-protected sets are unlocked with a signed, user-bound cookie.
- Text-to-speech uses the browser's free Web Speech API; terms are read in English and
  definitions in Uzbek (falling back to the default voice when no Uzbek voice is installed).
- Email changes are not verified, because the app does not send emails.
- `pnpm-workspace.yaml` sets `minimumReleaseAge: 1440`: pnpm only installs package versions that
  have been public for at least a day (the default supply-chain policy of newer pnpm releases).
  If an install reports `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` after a dependency update, wait a
  day or re-resolve with `pnpm install` on pnpm 10.16+.
