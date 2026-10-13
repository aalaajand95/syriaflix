import type { Episode, Season, Show } from "./types";

type Ref = { season: number; episode: number };

function flatten(show: Show): Ref[] {
  return show.seasons.flatMap((s) => s.episodes.map((e) => ({ season: s.number, episode: e.number })));
}

export function episodeCount(show: Show): number {
  return show.seasons.reduce((n, s) => n + s.episodes.length, 0);
}

export function firstEpisode(show: Show): { season: Season; episode: number } | undefined {
  const season = show.seasons.find((s) => s.episodes.length > 0);
  return season ? { season, episode: season.episodes[0].number } : undefined;
}

export function getEpisode(show: Show, seasonNumber: number, episodeNumber: number) {
  const season = show.seasons.find((s) => s.number === seasonNumber);
  const episode = season?.episodes.find((e) => e.number === episodeNumber);
  return season && episode ? { season, episode } : undefined;
}

/** The episode after the given one, rolling over into the next season. */
export function nextEpisode(show: Show, season: number, episode: number): Ref | undefined {
  const flat = flatten(show);
  const i = flat.findIndex((x) => x.season === season && x.episode === episode);
  return i >= 0 ? flat[i + 1] : undefined;
}

export function previousEpisode(show: Show, season: number, episode: number): Ref | undefined {
  const flat = flatten(show);
  const i = flat.findIndex((x) => x.season === season && x.episode === episode);
  return i > 0 ? flat[i - 1] : undefined;
}

export function episodeThumbnail(episode: Episode): string | undefined {
  if (episode.video) return episode.video.poster;
  return episode.youtubeId ? `https://i.ytimg.com/vi/${episode.youtubeId}/hqdefault.jpg` : undefined;
}
