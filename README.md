# GANG: friend group website

Our corner of the internet: photo albums, hangout plans, gaming sessions, and wishes & goals.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Firebase Firestore · hosted on Vercel.

## Run it

```bash
npm install
cp .env.example .env.local   # optional, see "Turn on sharing"
npm run dev
```

Open http://localhost:3000.

Without Firebase keys the site runs in **local mode**: everything is saved only in your browser, and a yellow banner says so.

## Turn on sharing (Firebase, ~5 minutes)

1. Go to https://console.firebase.google.com and click **Create a project** (Analytics not needed).
2. Open **Build → Firestore Database → Create database**. Pick a location near you (e.g. `asia-southeast2`, Jakarta) and start in **production mode**.
3. In the **Rules** tab, paste the contents of [`firestore.rules`](firestore.rules) and click **Publish**.
4. Open **Project settings** (gear icon) → **Your apps** → **Web** (`</>`) and register an app.
5. Copy the config values into `.env.local` (see [`.env.example`](.env.example)).
6. Restart `npm run dev`. The banner disappears, and everyone now sees the same data live.

The Firebase web keys aren't secret; access is controlled by the Firestore rules.

## Deploy (Vercel)

1. Go to https://vercel.com/new and import the `friend-group-website` GitHub repo.
2. Under **Environment Variables**, add the six `NEXT_PUBLIC_FIREBASE_*` values from `.env.local`.
3. Click **Deploy**. Every push to `main` redeploys automatically.

## Project layout

```
app/                 routes (/, /albums, /albums/[id], /hangouts, /gaming, /wishes)
features/            one folder per feature: list, cards, and create dialog
components/          shared UI (header, avatars, lightbox, form dialog)
components/ui/       shadcn/ui components
content/             members, photos, site name and game suggestions: edit these
lib/                 data store (Firestore/local), hooks, time and calendar helpers
public/members/      member profile photos
public/photos/       group photos
```

## Customising

- **Group name, tagline:** [`content/site.ts`](content/site.ts)
- **Members:** [`content/members.ts`](content/members.ts). Denis shows a "D" until you add `public/members/denis.jpeg` and set `photo` there.
- **New photos:** put them in `public/photos/`, then add a line to [`content/photos.ts`](content/photos.ts).

## How it works

- **No logins.** Each person picks who they are (top-right); the choice is stored in `localStorage`.
- **Live data.** Each collection (`hangouts`, `sessions`, `wishes`, `albums`) has one Firestore `onSnapshot` subscription, shared through `useSyncExternalStore` ([`lib/use-collection.ts`](lib/use-collection.ts)).
- **Pages are static shells.** Data and anything time-based ("in 3 days", LIVE) render in the browser, which keeps Cache Components prerendering happy.
- **Only share the link with the gang.** Anyone who has it can add or delete things.
- **Photo uploads** aren't supported in the site, because Firebase Storage needs a paid plan. Add photos by committing them.
