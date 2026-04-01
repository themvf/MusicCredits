# SoundSwap — Local Setup Guide

## 1. Prerequisites

- Node.js 18+ (https://nodejs.org)
- npm 9+
- A free Neon account (https://neon.tech)
- A free Clerk account (https://clerk.com)
- Git (optional, for deployment)

---

## 2. Clone / download the project

If you received this as a folder, simply open it in your terminal. Otherwise:

```bash
git clone <your-repo-url>
cd submithome-clone
```

---

## 3. Install dependencies

```bash
npm install
```

This also runs `prisma generate` automatically via the `postinstall` script.

---

## 4. Neon PostgreSQL setup

1. Go to https://console.neon.tech and create a free account.
2. Create a new project (any name, e.g. "soundswap").
3. In the project dashboard, click **Connection Details**.
4. Copy the **Connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. You will paste this as `DATABASE_URL` in step 6.

---

## 5. Clerk authentication setup

1. Go to https://dashboard.clerk.com and create a free account.
2. Create a new application (any name).
3. Choose **Email** and/or **Google** as sign-in methods (your choice).
4. In the sidebar go to **API Keys**.
5. Copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

---

## 6. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder values:

```env
DATABASE_URL=postgresql://...          # from Neon
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...   # from Clerk
CLERK_SECRET_KEY=sk_test_...           # from Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

## 7. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all four tables (User, Track, ListeningSession, Rating) in your
Neon database. You only need to run this once (or after schema changes).

---

## 8. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see the SoundSwap
landing page. Sign up and you will start with 10 credits.

---

## 9. Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts. When asked about environment variables, add all of the
variables from step 6.

### Option B — GitHub + Vercel dashboard

1. Push your code to a GitHub repository.
2. Go to https://vercel.com → New Project → Import your repo.
3. In the "Environment Variables" section, add every variable from `.env.local`.
4. Click **Deploy**.

Vercel will run `npm run build` (which includes `prisma generate`) automatically.

### Important: run migrations against production DB

After your first production deploy, run:

```bash
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

Or set `DATABASE_URL` in your shell and run `npx prisma migrate deploy`.

---

## 10. How the app works

| Action | Credit change |
|--------|--------------|
| Sign up | Start with 10 credits |
| Submit a Spotify track | -10 credits |
| Listen >= 30s + rate | +1 credit |

Users submit Spotify track URLs. Other users listen via the embedded Spotify
player. The Page Visibility API ensures the timer only counts when the tab is
in focus. The server re-validates the listen time before awarding credits.
