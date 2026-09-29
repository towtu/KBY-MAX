export const ZORYVA_BASE_URL = 'https://zoryva.me/embed';
export const ZORYVA_ACCENT_COLOR = '17c3d1';

const isValidId = (value) => /^[1-9]\d*$/.test(String(value));
const isValidEpisodeNumber = (value) => /^[1-9]\d*$/.test(String(value));

const normalizeProgress = (progress) => {
  const seconds = Math.floor(Number(progress));
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.min(seconds, 86400);
};

const buildUrl = (path, params) => {
  const search = new URLSearchParams();

  params.forEach(([key, value]) => {
    if (value === undefined || value === null || value === false || value === '') return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return `${ZORYVA_BASE_URL}${path}${query ? `?${query}` : ''}`;
};

const commonParams = (progress) => {
  const params = [
    ['color', ZORYVA_ACCENT_COLOR],
    ['autoplay', 'false']
  ];
  const normalizedProgress = normalizeProgress(progress);

  if (normalizedProgress > 0) {
    params.push(['startAt', normalizedProgress]);
  }

  return params;
};

export const buildZoryvaMovieUrl = ({ id, progress = 0 }) => {
  if (!isValidId(id)) return '';
  return buildUrl(`/movie/${id}`, commonParams(progress));
};

export const buildZoryvaTvUrl = ({ id, season = 1, episode = 1, progress = 0 }) => {
  if (!isValidId(id) || !isValidEpisodeNumber(season) || !isValidEpisodeNumber(episode)) return '';
  return buildUrl(`/tv/${id}/${season}/${episode}`, commonParams(progress));
};

export const buildZoryvaAnimeUrl = ({ id, season = 1, episode = 1, progress = 0 }) => {
  if (!isValidId(id) || !isValidEpisodeNumber(season) || !isValidEpisodeNumber(episode)) return '';
  return buildUrl(`/anime/${id}/${season}/${episode}`, commonParams(progress));
};

export const buildPlayerOptions = ({
  mediaType,
  id,
  season = 1,
  episode = 1,
  progress = 0
}) => {
  let src;

  if (mediaType === 'anime') {
    src = buildZoryvaAnimeUrl({ id, season, episode, progress });
  } else if (mediaType === 'tv') {
    src = buildZoryvaTvUrl({ id, season, episode, progress });
  } else {
    src = buildZoryvaMovieUrl({ id, progress });
  }

  return [
    { id: 'zoryva', label: 'Zoryva', name: 'Zoryva', src }
  ].filter((option) => option.src);
};
