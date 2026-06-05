import { mapAniListDetails, mapAniListMediaToCard } from './anime.js';

const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MTkxYTRiN2FjMTcyM2E3ZTE2YjZjZjk3OTMyNDNlMCIsIm5iZiI6MTc4MDQ3MDY0OS41MjQ5OTk5LCJzdWIiOiI2YTFmZDM3OTg1NjlhYzVkMGQ2ZTU0YzMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.vplYW1kqyw9INM9AbEzuSiLAHs2vhQSfOrpU7DGgjXg';
const BASE_URL = 'https://api.themoviedb.org/3';
const ANILIST_URL = 'https://graphql.anilist.co';
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

const fetchAniListGraphql = async (query, variables, {
  timeoutMs = API_TIMEOUT_MS,
  fetcher = fetch
} = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(createTimeoutError(ANILIST_URL));
  }, timeoutMs);

  try {
    const res = await fetcher(ANILIST_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`AniList API request failed with status ${res.status}`);
    }

    const data = await res.json();

    if (data.errors?.length) {
      throw new Error(data.errors[0]?.message || 'AniList API request failed');
    }

    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw createTimeoutError(ANILIST_URL);
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

const ANILIST_MEDIA_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  description(asHtml: false)
  coverImage {
    extraLarge
    large
  }
  bannerImage
  episodes
  duration
  averageScore
  genres
  format
  source
  status
  startDate {
    year
  }
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
`;

const TRENDING_ANIME_QUERY = `
  query TrendingAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
        ${ANILIST_MEDIA_FIELDS}
      }
    }
  }
`;

const ANIME_DETAILS_QUERY = `
  query AnimeDetails($id: Int) {
    Media(id: $id, type: ANIME) {
      ${ANILIST_MEDIA_FIELDS}
      recommendations(sort: RATING_DESC, perPage: 12) {
        nodes {
          mediaRecommendation {
            ${ANILIST_MEDIA_FIELDS}
          }
        }
      }
    }
  }
`;

const SEARCH_ANIME_QUERY = `
  query SearchAnime($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, search: $search, sort: SEARCH_MATCH, isAdult: false) {
        ${ANILIST_MEDIA_FIELDS}
      }
    }
  }
`;

export const fetchTrendingAnime = async ({
  page = 1,
  perPage = 18,
  ...requestOptions
} = {}) => {
  const data = await fetchAniListGraphql(TRENDING_ANIME_QUERY, { page, perPage }, requestOptions);
  return {
    results: data.data?.Page?.media?.map(mapAniListMediaToCard) || []
  };
};

export const searchAnime = async (query, {
  perPage = 8,
  ...requestOptions
} = {}) => {
  if (!query?.trim()) return { results: [] };

  const data = await fetchAniListGraphql(SEARCH_ANIME_QUERY, {
    search: query.trim(),
    perPage
  }, requestOptions);

  return {
    results: data.data?.Page?.media?.map(mapAniListMediaToCard) || []
  };
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

export const fetchAnimeDetails = async (id, requestOptions) => {
  const data = await fetchAniListGraphql(ANIME_DETAILS_QUERY, { id: Number(id) }, requestOptions);
  return mapAniListDetails(data.data?.Media);
};
