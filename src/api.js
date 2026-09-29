const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MTkxYTRiN2FjMTcyM2E3ZTE2YjZjZjk3OTMyNDNlMCIsIm5iZiI6MTc4MDQ3MDY0OS41MjQ5OTk5LCJzdWIiOiI2YTFmZDM3OTg1NjlhYzVkMGQ2ZTU0YzMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.vplYW1kqyw9INM9AbEzuSiLAHs2vhQSfOrpU7DGgjXg';
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const IMAGE_ORIGINAL_URL = 'https://image.tmdb.org/t/p/original';
export const API_TIMEOUT_MS = 10000;

export const getImageUrl = (path, original = false) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${original ? IMAGE_ORIGINAL_URL : IMAGE_BASE_URL}${path}`;
};

const fetchOptions = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_TOKEN}`
  }
};

const createTimeoutError = (url) => new Error(`Movie API request timed out: ${url}`);

export const fetchJson = async (url, {
  timeoutMs = API_TIMEOUT_MS,
  fetcher = fetch,
  options = fetchOptions
} = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(createTimeoutError(url));
  }, timeoutMs);

  try {
    const res = await fetcher(url, {
      ...options,
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`Movie API request failed with status ${res.status}: ${url}`);
    }

    return res.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw createTimeoutError(url);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchTrending = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/trending/all/day?language=en-US`, requestOptions);
};

export const fetchTrendingMovies = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/trending/movie/day?language=en-US`, requestOptions);
};

export const fetchTrendingTV = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/trending/tv/day?language=en-US`, requestOptions);
};

export const fetchPopular = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/movie/popular?language=en-US&page=1`, requestOptions);
};

export const fetchTopRated = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/movie/top_rated?language=en-US&page=1`, requestOptions);
};

export const fetchKDramas = async (requestOptions) => {
  return fetchJson(`${BASE_URL}/discover/tv?with_original_language=ko&language=en-US&page=1&sort_by=popularity.desc`, requestOptions);
};

export const fetchDiscoverMovies = async ({
  withGenres,
  sortBy = 'popularity.desc',
  page = 1,
  ...requestOptions
} = {}) => {
  const params = new URLSearchParams({
    language: 'en-US',
    page: String(page),
    sort_by: sortBy
  });

  if (withGenres) {
    params.set('with_genres', withGenres);
  }

  return fetchJson(`${BASE_URL}/discover/movie?${params.toString()}`, requestOptions);
};

export const fetchDiscoverTV = async ({
  withGenres,
  sortBy = 'popularity.desc',
  page = 1,
  ...requestOptions
} = {}) => {
  const params = new URLSearchParams({
    language: 'en-US',
    page: String(page),
    sort_by: sortBy
  });

  if (withGenres) {
    params.set('with_genres', withGenres);
  }

  return fetchJson(`${BASE_URL}/discover/tv?${params.toString()}`, requestOptions);
};

let cachedGenres = null;
let genresPromise = null;
export const fetchGenres = async () => {
  if (cachedGenres) return cachedGenres;
  if (genresPromise) return genresPromise;

  genresPromise = (async () => {
    try {
      const [movieData, tvData] = await Promise.all([
        fetchJson(`${BASE_URL}/genre/movie/list?language=en-US`),
        fetchJson(`${BASE_URL}/genre/tv/list?language=en-US`)
      ]);
      const map = {};
      if (movieData.genres) {
        movieData.genres.forEach(g => map[g.id] = g.name);
      }
      if (tvData.genres) {
        tvData.genres.forEach(g => map[g.id] = g.name);
      }
      cachedGenres = map;
      return map;
    } catch (error) {
      console.error("Failed to fetch genres", error);
      return {};
    }
  })();
  return genresPromise;
};

export const searchMovies = async (query, requestOptions) => {
  if (!query) return { results: [] };
  const data = await fetchJson(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, requestOptions);
  const filteredResults = data.results?.filter(item => item.media_type === 'movie' || item.media_type === 'tv') || [];
  return { ...data, results: filteredResults };
};

export const fetchMovieDetails = async (id) => {
  return fetchJson(`${BASE_URL}/movie/${id}?append_to_response=videos,credits,images,recommendations,similar&language=en-US`);
};

export const fetchTVDetails = async (id) => {
  return fetchJson(`${BASE_URL}/tv/${id}?append_to_response=videos,credits,images,recommendations,similar&language=en-US`);
};

export const fetchSeasonDetails = async (id, season, requestOptions) => {
  return fetchJson(`${BASE_URL}/tv/${id}/season/${season}?language=en-US`, requestOptions);
};

// ── AniList GraphQL API (Anime) ──────────────────────────────────────────────

const ANILIST_API_URL = 'https://graphql.anilist.co';

const fetchAniList = async (query, variables = {}, {
  fetcher = fetch,
  timeoutMs = API_TIMEOUT_MS
} = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetcher(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`AniList API request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (data.errors?.length) {
      throw new Error(data.errors.map((error) => error.message).join('; '));
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('AniList API request timed out', { cause: error });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const stripHtmlTags = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const mapAniListMedia = (media) => {
  if (!media) return null;

  const title = media.title?.english || media.title?.romaji || media.title?.native || 'Untitled';
  const startDate = media.startDate;
  const firstAirDate = startDate?.year
    ? `${startDate.year}-${String(startDate.month || 1).padStart(2, '0')}-${String(startDate.day || 1).padStart(2, '0')}`
    : '';

  return {
    id: media.id,
    title,
    name: title,
    poster_path: media.coverImage?.extraLarge || media.coverImage?.large || '',
    backdrop_path: media.bannerImage || '',
    vote_average: media.averageScore ? media.averageScore / 10 : null,
    overview: stripHtmlTags(media.description),
    media_type: 'anime',
    first_air_date: firstAirDate,
    genre_ids: [],
    genres: (media.genres || []).map((g) => ({ id: g, name: g })),
    popularity: media.popularity || 0,
    episodes: media.episodes || 0,
    format: media.format || ''
  };
};

const ANILIST_MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large }
  bannerImage
  description(asHtml: false)
  genres
  averageScore
  popularity
  episodes
  status
  startDate { year month day }
  format
`;

export const fetchTrendingAnime = async (requestOptions) => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ${ANILIST_MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniList(query, { page: 1, perPage: 20 }, requestOptions);
  const results = (data?.data?.Page?.media || []).map(mapAniListMedia).filter(Boolean);
  return { results };
};

export const fetchPopularAnime = async (requestOptions) => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ${ANILIST_MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniList(query, { page: 1, perPage: 20 }, requestOptions);
  const results = (data?.data?.Page?.media || []).map(mapAniListMedia).filter(Boolean);
  return { results };
};

export const searchAnime = async (query, requestOptions) => {
  if (!query) return { results: [] };

  const gqlQuery = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
          ${ANILIST_MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await fetchAniList(gqlQuery, { search: query, page: 1, perPage: 10 }, requestOptions);
  const results = (data?.data?.Page?.media || []).map(mapAniListMedia).filter(Boolean);
  return { results };
};

export const fetchAnimeDetails = async (id, requestOptions) => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        genres
        averageScore
        popularity
        episodes
        status
        season
        seasonYear
        format
        duration
        startDate { year month day }
        endDate { year month day }
        studios(isMain: true) {
          nodes { name }
        }
        characters(sort: ROLE, page: 1, perPage: 8) {
          nodes {
            name { full }
            image { large }
          }
        }
        recommendations(page: 1, perPage: 12) {
          nodes {
            mediaRecommendation {
              id
              type
              title { romaji english }
              coverImage { extraLarge large }
              bannerImage
              averageScore
              genres
              popularity
              episodes
              format
              startDate { year month day }
            }
          }
        }
        relations {
          nodes {
            id
            title { romaji english }
            coverImage { extraLarge large }
            bannerImage
            averageScore
            genres
            type
            format
            startDate { year month day }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { id: Number(id) }, requestOptions);
  const media = data?.data?.Media;
  if (!media) throw new Error(`Anime not found: ${id}`);

  const mapped = mapAniListMedia(media);

  return {
    ...mapped,
    episode_count: media.episodes || 0,
    status: media.status,
    duration: media.duration,
    season: media.season,
    seasonYear: media.seasonYear,
    studios: (media.studios?.nodes || []).map((s) => ({ name: s.name })),
    characters: (media.characters?.nodes || []).map((c) => ({
      name: c.name,
      image: c.image
    })),
    recommendations: (media.recommendations?.nodes || [])
      .filter((n) => n.mediaRecommendation?.type === 'ANIME')
      .map((n) => mapAniListMedia(n.mediaRecommendation))
      .filter(Boolean),
    relations: (media.relations?.nodes || [])
      .filter((n) => n.type === 'ANIME')
      .map(mapAniListMedia)
      .filter(Boolean)
  };
};
