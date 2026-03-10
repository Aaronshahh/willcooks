# Will Cooks

A free cooking blog with an interactive world map. Each recipe Will adds is pinned to its location on the map. Visitors click pins to browse recipes and watch videos.

**Entirely free to build and operate** — Supabase (free tier), Vercel/Netlify (free tier), Leaflet + OpenStreetMap (no API key), YouTube embeds.

---

## Tech stack

| Layer | Tool | Cost |
|-------|------|------|
| Framework | Next.js 16 (App Router) | Free |
| Database, Auth, Storage | Supabase | Free tier |
| Map | Leaflet + CARTO dark tiles | Free |
| Geocoding | Nominatim / OpenStreetMap | Free |
| Videos | YouTube embeds | Free |
| Hosting | Vercel or Netlify | Free tier |

---

## Setup (one-time, ~15 minutes)

### 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → create a free account → **New Project**.
2. Copy your **Project URL** and **anon/public key** from *Settings → API*.
3. In the Supabase **SQL Editor**, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates the recipes table, sets up row-level security, and creates the storage bucket.
4. Go to **Authentication → Users → Add user** and create Will's account (email + password). He'll use these to log in at `/admin`.

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy (Vercel – recommended)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Add the two environment variables from step 2 in *Settings → Environment Variables*.
4. Deploy. Done — the site is live and free.

---

## How Will uses it

1. Go to `yoursite.com/admin` (or share that link with him).
2. Log in with the email and password you created in Supabase.
3. Click **+ New Recipe**.
4. Fill in:
   - **Title** – e.g. "Tokyo Ramen"
   - **Location** – e.g. "Tokyo, Japan" (the map pin appears automatically)
   - **YouTube URL** – paste the video link from YouTube
   - **Cover image** – upload a photo (max 2MB)
   - **Blog post** – write the recipe using the rich text editor
5. Toggle **Published** when ready, and click **Create Recipe**.
6. The pin appears on the world map instantly.

---

## Project structure

```
app/
  page.tsx                    ← World map landing page
  recipe/[slug]/page.tsx      ← Public recipe detail page
  admin/
    page.tsx                  ← Redirects to /admin/recipes
    login/page.tsx            ← Will's login page
    recipes/page.tsx          ← Recipe list (admin)
    recipes/new/page.tsx      ← Add recipe
    recipes/[id]/edit/page.tsx ← Edit recipe
  actions/recipes.ts          ← Server actions (save, geocode)

components/
  WorldMap.tsx                ← Leaflet map with pins and sidebar
  RecipeForm.tsx              ← Add/edit recipe form
  RichTextEditor.tsx          ← Tiptap WYSIWYG editor
  AdminShell.tsx              ← Admin nav wrapper
  DeleteRecipeButton.tsx      ← Client delete button

lib/
  supabase/client.ts          ← Browser Supabase client
  supabase/server.ts          ← Server Supabase client
  supabase/middleware.ts      ← Session helper (used by proxy.ts)
  geocode.ts                  ← Nominatim geocoding
  recipes.ts                  ← Types and helper functions
  auth.ts                     ← requireAuth() guard

supabase/
  schema.sql                  ← Run this in Supabase SQL Editor
```

---

## Free tier limits

| Service | Limit | Notes |
|---------|-------|-------|
| Supabase DB | 500 MB | Recipes are tiny; this lasts years |
| Supabase Storage | 1 GB | Keep cover images < 500 KB |
| Vercel | 100 GB bandwidth | Fine for a personal blog |
| Nominatim geocoding | 1 req/sec | Only called when Will saves a recipe |
| YouTube | Unlimited | Videos live on YouTube; no storage cost |

If Supabase pauses your project due to inactivity (7 days), just visit the Supabase dashboard and click **Restore** — the site resumes immediately.
