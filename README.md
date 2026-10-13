# SyriaFlix · سيريافليكس

A free, Netflix-style library of Syrian drama and TV, in Arabic (RTL, default) and English.

SyriaFlix hosts no video. Episodes are embedded from official YouTube uploads, and the site is the catalog and player around them. The whole site is static HTML, so it can be hosted for free on Vercel, Netlify, Cloudflare Pages or GitHub Pages.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /ar/
npm run build      # validates the catalog, then writes the static site to ./out
npm run preview    # serve ./out locally
```

Set `NEXT_PUBLIC_SITE_URL` (for example `https://syriaflix.org`) at build time so `sitemap.xml` has the right URLs.

## Pages

| Route | What it is |
| --- | --- |
| `/ar/`, `/en/` | Home page: a featured hero, then "continue watching" and rows by genre |
| `/{locale}/shows/{slug}/` | Show page: synopsis, cast and crew, season tabs, episode list |
| `/{locale}/watch/{slug}/?s=1&e=1` | Player. It goes to the next episode on its own and remembers progress in this browser |
| `/{locale}/browse/?genre=&decade=` | Filter by genre and decade |
| `/{locale}/search/?q=` | Search titles and cast in Arabic or English. Matching ignores diacritics and alef/ya/ta-marbuta spelling differences |

## Adding shows and episodes

Each series is one JSON file in `src/data/shows/<slug>.json`:

```jsonc
{
  "slug": "diaa-dayaa",
  "title":    { "ar": "ضيعة ضايعة", "en": "Diaa Dayaa" },
  "synopsis": { "ar": "…", "en": "…" },
  "year": 2008, "endYear": 2010,
  "genres": ["comedy"],          // drama, comedy, shami, historical, bedouin, social, classic
  "director": { "ar": "الليث حجو", "en": "Al-Laith Hajjo" },
  "cast": [{ "ar": "نضال سيجري", "en": "Nidal Sijri" }],
  "youtubeSearch": "ضيعة ضايعة الحلقة 1",   // used for "Find on YouTube" until episodes exist
  "featured": true,
  "seasons": [
    { "number": 1, "youtubePlaylistId": "PL…", "episodes": [{ "number": 1, "youtubeId": "xxxxxxxxxxx" }] }
  ]
}
```

A show with no episodes still appears in the catalog, marked **Coming soon**, with a "Find on YouTube" link.

### Import a season from an official YouTube playlist

1. Find the series' playlist on the producer's or broadcaster's official channel.
2. Get a free YouTube Data API key (Google Cloud Console → enable *YouTube Data API v3* → Credentials).
3. Run:

```bash
YOUTUBE_API_KEY=your-key npm run import-playlist -- diaa-dayaa 1 "https://www.youtube.com/playlist?list=PL…"
npm run validate:online   # checks every video is public and embeddable
```

The importer numbers episodes in playlist order. Check the order, and fix the file if the playlist is out of sequence.

Only use uploads from rights holders' official channels. Re-uploads get taken down and break the player.

## Checks

```bash
npm run lint && npm run typecheck && npm run validate
```

## Stack

Next.js 15 (App Router, static export), React 19, Tailwind CSS 4, and the Cairo font. Catalog data is read from JSON at build time. There is no database and no server.
