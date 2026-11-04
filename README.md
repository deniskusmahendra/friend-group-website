# GANG: friend group website

Our corner of the internet: photo albums, hangout plans, gaming sessions, wishes & goals, and badges.

Live at **https://friend-group-website.vercel.app**

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Firebase Firestore · Vercel Blob · hosted on Vercel.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the Firebase keys, see below
npm run dev
```

Open http://localhost:3000.

Without Firebase keys the site runs in **local mode**: everything is saved only in your browser, and a yellow banner says so.

## Set up Firebase (shared data)

1. Go to https://console.firebase.google.com and click **Create a project** (Analytics not needed).
2. Open **Build → Firestore Database → Create database**. Pick a location near you (e.g. `asia-southeast2`, Jakarta) and start in **production mode**. (Firestore, not "Realtime Database".)
3. In the **Rules** tab, paste the contents of [`firestore.rules`](firestore.rules) and click **Publish**. Do this again whenever that file changes.
4. Open **Project settings** (gear icon) → **Your apps** → **Web** (`</>`) and register an app.
5. Copy the config values into `.env.local` (see [`.env.example`](.env.example)).
6. Restart `npm run dev`. The banner disappears, and everyone now sees the same data live.

The Firebase web keys aren't secret; access is controlled by the Firestore rules.

## Deploy (Vercel)

1. Go to https://vercel.com/new and import the `friend-group-website` GitHub repo.
2. Under **Environment Variables**, add the six `NEXT_PUBLIC_FIREBASE_*` values from `.env.local`.
3. Click **Deploy**. Every push to `main` redeploys automatically.

## Set up photo uploads (Vercel Blob)

Uploaded photos are stored in Vercel Blob, which is free on the Hobby plan (about 1 GB storage and 10 GB downloads a month). If a limit is hit, uploads stop; you're never billed.

1. In your Vercel project, open **Storage → Create → Blob**. Choose **Public** access and connect it to the project (all environments).
   Vercel adds `BLOB_STORE_ID` (and `BLOB_WEBHOOK_PUBLIC_KEY`) to the project and signs the site in to the store automatically (OIDC). No token to copy.
2. **Redeploy** (Deployments → ⋯ → Redeploy) so the site picks up the new variables.

Uploads on `npm run dev` are optional (the live site is enough). If you want them:

```bash
npx vercel link                 # once, pick the friend-group-website project
npx vercel env pull .env.local  # adds BLOB_STORE_ID and a VERCEL_OIDC_TOKEN
```

The pulled token expires after about 12 hours; run `env pull` again when uploads start failing locally. `env pull` rewrites `.env.local` from Vercel's variables, so keep the Firebase keys in Vercel too.

Photos are shrunk in the browser before upload (max 1920px, WebP), so each is usually a few hundred KB.

## Using the site

- **Who are you?** There are no logins. Each person picks their name (top-right); it's remembered in that browser.
- **Albums.** *Together* holds the built-in photos and everything uploaded there. A photo uploaded inside another album stays in that album only. Albums can also include existing photos picked in **Edit**.
- **Reactions & comments.** Open any photo to react (❤️ 😂 🔥 😮 😭 💀, tap again to undo) and comment. Thumbnails show the counts. You can delete your own comments (they go to Trash).
- **Removing photos.** Unticking a photo in an album's **Edit** removes it from that album; if it was uploaded *into* that album, it's deleted (it has nowhere else to live). Whoever uploaded a photo can also delete it from the photo viewer.
- **Badges** (`/badges`). 14 achievements, each with bronze, silver and gold levels: planning and going to hangouts, gaming (including late-night sessions), uploading photos, making albums, wishes and goals, cheering, commenting and reacting. There's a leaderboard, and you get a pop-up when you reach a new level.
- **Trash.** Nothing is erased right away. Deleting a hangout, session, wish, album, photo or comment moves it to **Trash** (link in the footer, `/trash`), with an **Undo** button on the toast. Anything in Trash can be restored for 30 days, then it's removed for good, including the photo file.
- **Backup.** The Trash page has **Download backup** (everything, as one JSON file) and **Restore from backup**, which brings back whatever is missing and never overwrites what still exists. Photo files aren't in the backup, so keep a copy of photos you care about.

## Project layout

```
app/                 routes (/, /albums, /albums/[id], /hangouts, /gaming, /wishes, /badges, /trash)
app/api/             upload (presigned Blob URLs) and photo-file delete routes
features/            one folder per feature: list, cards, and create dialog
components/          shared UI (header, avatars, photo viewer with reactions/comments, form dialog)
components/ui/       shadcn/ui components
content/             members, built-in photos, site name and game suggestions: edit these
lib/                 data store (Firestore/local), trash & backup, hooks, image compression, time and calendar helpers
public/members/      member profile photos
public/photos/       built-in group photos
```

## Customising

- **Group name, tagline, home photo:** [`content/site.ts`](content/site.ts)
- **Members:** [`content/members.ts`](content/members.ts). Photos live in `public/members/`; a member without a photo shows their initial.
- **New photos:** use **Upload photos** on the Albums page. (Or commit them to `public/photos/` and add a line to [`content/photos.ts`](content/photos.ts).)
- **Game suggestions:** the `games` list in [`content/site.ts`](content/site.ts).

## How it works

- **Live data.** Firestore has seven collections: `hangouts`, `sessions`, `wishes`, `albums`, `photos`, `reactions`, `comments`. Each has one `onSnapshot` subscription, shared through `useSyncExternalStore` ([`lib/use-collection.ts`](lib/use-collection.ts)).
- **Trash is a field.** Deleting sets `deletedAt`/`deletedBy` instead of removing the document ([`lib/trash.ts`](lib/trash.ts)). Lists hide those; the Trash page shows them. When someone opens the site, their browser removes anything that has been in Trash for over 30 days. The Firestore rules only allow that final removal after 30 days, and don't let `deletedAt` be backdated.
- **Photos.** The browser compresses each photo, asks [`app/api/upload/route.ts`](app/api/upload/route.ts) for a short-lived presigned URL (images only, max 5 MB, `photos/` folder only) and uploads straight to Vercel Blob. A record (with the album it was uploaded into) is saved in the `photos` collection. The file itself is deleted through [`app/api/photos/route.ts`](app/api/photos/route.ts) when its Trash time is up.
- **Reactions** are one document per photo (id = a hash of the photo URL) holding a map of members per emoji. They're written with a merge, so two people reacting at once don't overwrite each other. **Comments** are one document each, pointing at the photo URL. Both work on built-in and uploaded photos.
- **Badges** aren't stored anywhere: they're worked out live from the data ([`features/badges/badges.ts`](features/badges/badges.ts)), so deleting or restoring things updates them. Each browser remembers which levels it has already announced, to show the unlock pop-up only once.
- **Pages are static shells.** Data and anything time-based ("in 3 days", LIVE) render in the browser, which keeps Cache Components prerendering happy.
- **Only share the link with the gang.** There's no password: anyone who has the link can add things, or move them to Trash.
