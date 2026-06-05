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
