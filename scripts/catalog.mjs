#!/usr/bin/env node
// Catalog tooling for src/data/shows/*.json.
//
//   node scripts/catalog.mjs validate [--online]
//       Checks every show file for required fields, duplicate slugs/episodes and
//       well-formed YouTube IDs. With --online, also confirms each video is
//       public and embeddable via YouTube's oEmbed endpoint.
//
//   node scripts/catalog.mjs add-video <slug> <season> <episode> <src> [poster]
//       Adds (or replaces) a self-hosted episode. <src> is an HLS playlist
//       (.m3u8) or an .mp4/.webm file URL, e.g. from Bunny Stream or Cloudflare Stream.
//
//   YOUTUBE_API_KEY=... node scripts/catalog.mjs import <slug> <season> <playlistId|playlistUrl>
//       Imports every video of an official YouTube playlist as the episodes of
//       a season (in playlist order). Get a free key at
//       https://console.cloud.google.com/apis/library/youtube.googleapis.com

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "src", "data", "shows");
const GENRES = ["drama", "comedy", "shami", "historical", "bedouin", "social", "classic"];
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_SRC = /^https:\/\/\S+\.(m3u8|mp4|webm)(\?\S*)?$/i;
const HTTPS = /^https:\/\/\S+$/;

const file = (slug) => path.join(DATA_DIR, `${slug}.json`);
const load = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const localized = (v) => v && typeof v.ar === "string" && v.ar && typeof v.en === "string" && v.en;

async function validate(online) {
  const errors = [];
  const slugs = new Set();
  const videos = [];
  const hosted = [];

  for (const name of fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"))) {
    const err = (m) => errors.push(`${name}: ${m}`);
    let show;
    try {
      show = load(path.join(DATA_DIR, name));
    } catch (e) {
      err(`invalid JSON (${e.message})`);
      continue;
    }
    if (`${show.slug}.json` !== name) err(`slug "${show.slug}" must match file name`);
    if (slugs.has(show.slug)) err(`duplicate slug`);
    slugs.add(show.slug);
    if (!/^[a-z0-9-]+$/.test(show.slug ?? "")) err("slug must be lowercase latin letters, digits and dashes");
    for (const k of ["title", "synopsis"]) if (!localized(show[k])) err(`${k} needs non-empty "ar" and "en"`);
    for (const k of ["director", "writer"]) if (show[k] && !localized(show[k])) err(`${k} needs "ar" and "en"`);
    if (!Array.isArray(show.cast) || !show.cast.every(localized)) err(`cast must be a list of {ar, en}`);
    if (!Number.isInteger(show.year)) err("year must be an integer");
    if (!Array.isArray(show.genres) || !show.genres.length) err("genres must be a non-empty list");
    for (const g of show.genres ?? []) if (!GENRES.includes(g)) err(`unknown genre "${g}" (allowed: ${GENRES.join(", ")})`);
    if (!Array.isArray(show.seasons)) {
      err("seasons must be a list");
      continue;
    }
    const seasonNums = new Set();
    for (const s of show.seasons) {
      if (seasonNums.has(s.number)) err(`duplicate season ${s.number}`);
      seasonNums.add(s.number);
      const epNums = new Set();
      for (const e of s.episodes ?? []) {
        if (epNums.has(e.number)) err(`season ${s.number}: duplicate episode ${e.number}`);
        epNums.add(e.number);
        const where = `season ${s.number} episode ${e.number}`;
        if (Boolean(e.youtubeId) === Boolean(e.video)) {
          err(`${where}: needs exactly one of "youtubeId" or "video"`);
        } else if (e.video) {
          if (!VIDEO_SRC.test(e.video.src ?? "")) err(`${where}: video.src must be an https .m3u8/.mp4/.webm URL`);
          if (e.video.poster && !HTTPS.test(e.video.poster)) err(`${where}: video.poster must be an https URL`);
          for (const t of e.video.subtitles ?? [])
            if (!t.lang || !t.label || !HTTPS.test(t.src ?? "")) err(`${where}: subtitles need lang, label and an https src`);
          hosted.push({ where: `${name} S${s.number}E${e.number}`, src: e.video.src });
        } else if (!YT_ID.test(e.youtubeId)) {
          err(`${where}: bad youtubeId "${e.youtubeId}"`);
        } else {
          videos.push({ where: `${name} S${s.number}E${e.number}`, id: e.youtubeId });
        }
      }
    }
  }

  if (online) {
    for (const v of videos) {
      const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${v.id}`)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) errors.push(`${v.where}: video ${v.id} is unavailable or not embeddable (HTTP ${res.status})`);
      } catch (e) {
        errors.push(`${v.where}: could not reach YouTube (${e.message})`);
      }
    }
  }

  if (online) {
    for (const v of hosted) {
      try {
        const res = await fetch(v.src, { method: "HEAD" });
        if (!res.ok) errors.push(`${v.where}: ${v.src} returned HTTP ${res.status}`);
      } catch (e) {
        errors.push(`${v.where}: could not reach ${v.src} (${e.message})`);
      }
    }
  }

  if (errors.length) {
    console.error(errors.map((e) => `✗ ${e}`).join("\n"));
    process.exit(1);
  }
  console.log(
    `✓ ${slugs.size} shows, ${videos.length + hosted.length} episodes (${hosted.length} self-hosted, ${videos.length} YouTube) OK${online ? " — checked online" : ""}`,
  );
}

async function importPlaylist(slug, seasonArg, playlistArg) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!slug || !seasonArg || !playlistArg) throw new Error("usage: import <slug> <season> <playlistId|url>");
  if (!key) throw new Error("set YOUTUBE_API_KEY");
  if (!fs.existsSync(file(slug))) throw new Error(`no show file ${file(slug)} — create it first`);
  const playlistId = playlistArg.includes("list=") ? new URL(playlistArg).searchParams.get("list") : playlistArg;
  const seasonNumber = Number(seasonArg);

  const items = [];
  let pageToken = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.search = new URLSearchParams({ part: "snippet,status", maxResults: "50", playlistId, key, pageToken }).toString();
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error?.message ?? `HTTP ${res.status}`);
    items.push(...body.items);
    pageToken = body.nextPageToken ?? "";
  } while (pageToken);

  const episodes = items
    .filter((i) => i.status?.privacyStatus !== "private" && i.snippet.title !== "Deleted video")
    .map((i, idx) => ({ number: idx + 1, youtubeId: i.snippet.resourceId.videoId }));

  const show = load(file(slug));
  const season = { number: seasonNumber, youtubePlaylistId: playlistId, episodes };
  show.seasons = [...show.seasons.filter((s) => s.number !== seasonNumber), season].sort((a, b) => a.number - b.number);
  fs.writeFileSync(file(slug), `${JSON.stringify(show, null, 2)}\n`);
  console.log(`✓ ${slug} season ${seasonNumber}: imported ${episodes.length} episodes from ${playlistId}`);
}

function addVideo(slug, seasonArg, episodeArg, src, poster) {
  if (!slug || !seasonArg || !episodeArg || !src) throw new Error("usage: add-video <slug> <season> <episode> <src> [poster]");
  if (!fs.existsSync(file(slug))) throw new Error(`no show file ${file(slug)} — create it first`);
  if (!VIDEO_SRC.test(src)) throw new Error("src must be an https .m3u8, .mp4 or .webm URL");
  if (poster && !HTTPS.test(poster)) throw new Error("poster must be an https URL");
  const seasonNumber = Number(seasonArg);
  const episodeNumber = Number(episodeArg);
  const show = load(file(slug));
  let season = show.seasons.find((s) => s.number === seasonNumber);
  if (!season) {
    season = { number: seasonNumber, episodes: [] };
    show.seasons = [...show.seasons, season].sort((a, b) => a.number - b.number);
  }
  const episode = { number: episodeNumber, video: { src, ...(poster ? { poster } : {}) } };
  season.episodes = [...season.episodes.filter((e) => e.number !== episodeNumber), episode].sort(
    (a, b) => a.number - b.number,
  );
  fs.writeFileSync(file(slug), `${JSON.stringify(show, null, 2)}\n`);
  console.log(`✓ ${slug} S${seasonNumber}E${episodeNumber} → ${src}`);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "validate") await validate(args.includes("--online"));
  else if (cmd === "import") await importPlaylist(...args);
  else if (cmd === "add-video") addVideo(...args);
  else {
    console.error(
      "usage: node scripts/catalog.mjs validate [--online] | add-video <slug> <season> <episode> <src> [poster] | import <slug> <season> <playlist>",
    );
    process.exit(1);
  }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
