export const stripAniListHtml = (value = '') => {
  return String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getAniListTitle = (media = {}) => {
  return media.title?.english || media.title?.romaji || media.title?.native || 'Untitled anime';
};

const createGenreId = (genre = '') => `anime-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

export const parseStreamingEpisode = (episode = {}, fallbackNumber = 1) => {
  const rawTitle = String(episode.title || '').trim();
  const numberMatch = rawTitle.match(/(?:episode|ep\.?)\s*(\d+)/i) || rawTitle.match(/^(\d+)\b/);
  const episodeNumber = Number(numberMatch?.[1]) || fallbackNumber;
  const cleanedTitle = rawTitle
    .replace(/^\s*(?:episode|ep\.?)\s*\d+\s*[-:–—]?\s*/i, '')
    .replace(/^\s*\d+\s*[-:–—]?\s*/i, '')
    .trim();

  return {
    episode_number: episodeNumber,
    name: cleanedTitle || `Episode ${episodeNumber}`,
    still_path: episode.thumbnail || ''
  };
};

export const buildAnimeEpisodeCards = (media = {}) => {
  const streamingEpisodes = Array.isArray(media.streamingEpisodes)
    ? media.streamingEpisodes.map((episode, index) => parseStreamingEpisode(episode, index + 1))
    : [];
  const maxStreamingEpisode = streamingEpisodes.reduce((max, episode) => {
    return Math.max(max, episode.episode_number || 0);
  }, 0);
  const episodeCount = Number(media.episodes) || maxStreamingEpisode || streamingEpisodes.length || 0;
  const fallbackImage = media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large || '';
  const episodeByNumber = new Map();

  streamingEpisodes.forEach((episode) => {
    if (episode.episode_number && !episodeByNumber.has(episode.episode_number)) {
      episodeByNumber.set(episode.episode_number, episode);
    }
  });

  return Array.from({ length: episodeCount }, (_, index) => {
    const episodeNumber = index + 1;
    const episode = episodeByNumber.get(episodeNumber);

    return {
      episode_number: episodeNumber,
      name: episode?.name || `Episode ${episodeNumber}`,
      still_path: episode?.still_path || fallbackImage
    };
  });
};

export const mapAniListMediaToCard = (media = {}) => {
  const year = media.startDate?.year;
  const genres = Array.isArray(media.genres)
    ? media.genres.map((name) => ({ id: createGenreId(name), name }))
    : [];

  return {
    id: media.id,
    mal_id: media.idMal || null,
    media_type: 'anime',
    title: getAniListTitle(media),
    overview: stripAniListHtml(media.description),
    poster_path: media.coverImage?.extraLarge || media.coverImage?.large || '',
    backdrop_path: media.bannerImage || media.coverImage?.extraLarge || '',
    vote_average: media.averageScore ? media.averageScore / 10 : null,
    genre_ids: genres.map((genre) => genre.id),
    genres,
    first_air_date: year ? `${year}-01-01` : '',
    episodes: media.episodes || 0,
    runtime: media.format === 'MOVIE' ? media.duration : undefined,
    episode_run_time: media.format !== 'MOVIE' && media.duration ? [media.duration] : [],
    format: media.format || '',
    source: media.source || '',
    status: media.status || '',
    animeEpisodes: buildAnimeEpisodeCards(media)
  };
};

export const mapAniListDetails = (media = {}) => {
  const recommendations = media.recommendations?.nodes
    ?.map((node) => node.mediaRecommendation)
    ?.filter(Boolean)
    ?.map(mapAniListMediaToCard) || [];

  return {
    ...mapAniListMediaToCard(media),
    recommendations: { results: recommendations }
  };
};
