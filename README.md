# SyriaFlix · سيريافليكس

A free, Netflix-style library of Syrian drama and TV, in Arabic (RTL, default) and English.

Every episode plays inside SyriaFlix's own player and its own controls. Each episode comes from one of two sources:

- **Self-hosted:** an HLS stream (`.m3u8`) or an `.mp4`/`.webm` file on a video host such as Bunny Stream or Cloudflare Stream. Use this for episodes you own or have licensed.
- **YouTube:** an official upload, played through the YouTube embed with YouTube's own controls turned off.

The site itself is static HTML, so it can be hosted for free on Vercel, Netlify, Cloudflare Pages or GitHub Pages. Only the video host costs money.

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
| `/{locale}/watch/{slug}/?s=1&e=1` | Player. It resumes where you stopped, goes to the next episode on its own, and remembers progress in this browser |
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
  "featured": true,
  "seasons": [
    {
      "number": 1,
      "episodes": [
        // self-hosted
        { "number": 1, "video": {
            "src": "https://vz-abc123.b-cdn.net/<video-id>/playlist.m3u8",
            "poster": "https://vz-abc123.b-cdn.net/<video-id>/thumbnail.jpg",
            "subtitles": [{ "lang": "en", "label": "English", "src": "https://…/ep1.en.vtt" }]
        } },
        // or an official YouTube upload
        { "number": 2, "youtubeId": "xxxxxxxxxxx" }
      ]
    }
  ]
}
```

Every episode has exactly one of `video` or `youtubeId`. A show with no episodes still appears in the catalog, marked **Coming soon**.

### Self-hosted episodes

1. Upload the episode to a video host that gives you an HLS URL:
   - **[Bunny Stream](https://bunny.net/stream/):** the cheapest option. In the video's details, the HLS playlist URL looks like `https://vz-….b-cdn.net/<id>/playlist.m3u8` and the thumbnail like `…/<id>/thumbnail.jpg`.
   - **[Cloudflare Stream](https://www.cloudflare.com/products/cloudflare-stream/):** the URL looks like `https://customer-….cloudflarestream.com/<id>/manifest/video.m3u8`.
   - Any CDN or bucket that serves `.mp4` files also works, though HLS adapts better to slow connections.
2. Add the episode:

```bash
npm run add-video -- diaa-dayaa 1 1 "https://vz-….b-cdn.net/<id>/playlist.m3u8" "https://vz-….b-cdn.net/<id>/thumbnail.jpg"
```

3. On the host, turn on CORS, or add your site's domain to its allowed referrers. HLS playback and subtitles both need it.
4. Lock playback to your domain, so other sites can't use your bandwidth. In Bunny this is *Allowed referrers* or *Token authentication*.

Upload only episodes you own or have a license for from the producer. Self-hosting someone else's series without permission is copyright infringement, even on a free, non-commercial site.

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

YouTube's embed terms don't allow drawing anything over their player. On YouTube episodes, the SyriaFlix control bar therefore sits directly below the video. On self-hosted episodes it overlays the video.

### Player shortcuts

Space or `K` plays and pauses, `←` and `→` jump 10 seconds, `F` toggles full screen, and `M` toggles mute.

## Checks

```bash
npm run lint && npm run typecheck && npm run validate
```

## Stack

Next.js 15 (App Router, static export), React 19, Tailwind CSS 4, hls.js and the Cairo font. Catalog data is read from JSON at build time. There is no database and no server.
