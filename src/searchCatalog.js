import {
  fetchDiscoverMovies,
  fetchKDramas,
  fetchPopular,
  fetchTrendingAnime,
  fetchTopRated,
  fetchTrending,
  fetchTrendingMovies,
  fetchTrendingTV,
  searchAnime,
  searchMovies
} from './api.js';
import { MOVIE_CATEGORY_ROWS } from './homeRows.js';

let catalogPromise = null;

const getSearchTitle = (item) => item?.title || item?.name || '';

export const normalizeSearchText = (value = '') => {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const levenshteinDistance = (left, right) => {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
};

const scoreTokenAgainstTitle = (queryToken, titleTokens) => {
  return titleTokens.filter((titleToken) => titleToken.length >= 3).reduce((bestScore, titleToken) => {
    if (titleToken === queryToken) return 1;
    if (titleToken.includes(queryToken) || queryToken.includes(titleToken)) {
      return Math.max(bestScore, 0.88);
    }

    const distance = levenshteinDistance(queryToken, titleToken);
    const score = 1 - (distance / Math.max(queryToken.length, titleToken.length));
    return Math.max(bestScore, score);
  }, 0);
};

const scoreSearchItem = (query, item) => {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(getSearchTitle(item));

  if (!normalizedQuery || !normalizedTitle) return 0;
  if (normalizedTitle === normalizedQuery) return 1;
  if (normalizedTitle.includes(normalizedQuery)) return 0.96;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const titleTokens = normalizedTitle.split(' ').filter(Boolean);
  const tokenScores = queryTokens.map((token) => scoreTokenAgainstTitle(token, titleTokens));
  const averageTokenScore = tokenScores.reduce((sum, score) => sum + score, 0) / tokenScores.length;
  const matchedTokenShare = tokenScores.filter((score) => score >= 0.72).length / queryTokens.length;

  return (averageTokenScore * 0.72) + (matchedTokenShare * 0.28);
};

const dedupeResults = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.media_type || (item.name ? 'tv' : 'movie')}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const collectSettledResults = (settledResults) => {
  return settledResults.flatMap((result) => {
    if (result.status !== 'fulfilled') return [];
    return result.value?.results || [];
  });
};

export const findFuzzyMatches = (query, catalog, { limit = 18, minScore = 0.68 } = {}) => {
  return dedupeResults(catalog)
    .map((item) => ({
      item,
      score: scoreSearchItem(query, item)
    }))
    .filter(({ score }) => score >= minScore)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.item.popularity || 0) - (left.item.popularity || 0);
    })
    .slice(0, limit)
    .map(({ item }) => item);
};

export const fetchSearchCatalog = async () => {
  if (catalogPromise) return catalogPromise;

  catalogPromise = Promise.allSettled([
    fetchTrending(),
    fetchPopular(),
    fetchTrendingMovies(),
    fetchTrendingTV(),
    fetchTrendingAnime(),
    fetchKDramas(),
    fetchTopRated(),
    ...MOVIE_CATEGORY_ROWS.map((row) => fetchDiscoverMovies({
      withGenres: row.withGenres,
      sortBy: row.sortBy
    }))
  ]).then(collectSettledResults).then(dedupeResults);

  return catalogPromise;
};

export const searchMoviesWithFallback = async (query) => {
  if (!query?.trim()) return { results: [], usedFallback: false };

  const [movieSearch, animeSearch] = await Promise.allSettled([
    searchMovies(query),
    searchAnime(query)
  ]);
  const remoteData = movieSearch.status === 'fulfilled'
    ? movieSearch.value
    : { results: [] };
  const remoteResults = dedupeResults([
    ...(movieSearch.status === 'fulfilled' ? movieSearch.value.results || [] : []),
    ...(animeSearch.status === 'fulfilled' ? animeSearch.value.results || [] : [])
  ]);

  if (remoteResults.length >= 6) {
    return { ...remoteData, results: remoteResults, usedFallback: false };
  }

  const catalog = await fetchSearchCatalog();
  const fuzzyResults = findFuzzyMatches(query, catalog, { limit: 18 });
  const results = fuzzyResults.length > 0
    ? fuzzyResults
    : remoteResults.slice(0, 18);

  return {
    ...remoteData,
    results,
    usedFallback: fuzzyResults.length > 0
  };
};
