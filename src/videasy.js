export const VIDEASY_BASE_URL = 'https://player.videasy.net';
export const VIDEASY_COLOR = '17c3d1';

const normalizeProgress = (progress) => {
  const seconds = Math.floor(Number(progress));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
};

const buildUrl = (path, params) => {
  const search = new URLSearchParams();

  params.forEach(([key, value]) => {
    if (value === undefined || value === null || value === false || value === '') return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return `${VIDEASY_BASE_URL}${path}${query ? `?${query}` : ''}`;
};

const commonParams = (progress) => {
  const params = [
    ['color', VIDEASY_COLOR],
    ['overlay', true]
  ];
  const normalizedProgress = normalizeProgress(progress);

  if (normalizedProgress > 0) {
    params.push(['progress', normalizedProgress]);
  }

  return params;
};

export const buildVideasyMovieUrl = ({ id, progress = 0 }) => {
  return buildUrl(`/movie/${id}`, commonParams(progress));
};

export const buildVideasyTvUrl = ({ id, season = 1, episode = 1, progress = 0 }) => {
  const params = [
    ['color', VIDEASY_COLOR],
    ['nextEpisode', true],
    ['episodeSelector', true],
    ['autoplayNextEpisode', true],
    ['overlay', true]
  ];
  const normalizedProgress = normalizeProgress(progress);

  if (normalizedProgress > 0) {
    params.push(['progress', normalizedProgress]);
  }

  return buildUrl(`/tv/${id}/${season || 1}/${episode || 1}`, params);
};

export const buildVideasyAnimeUrl = ({ id, episode, progress = 0 }) => {
  const path = episode ? `/anime/${id}/${episode}` : `/anime/${id}`;
  const params = episode
    ? [
      ['color', VIDEASY_COLOR],
      ['episodeSelector', true],
      ['overlay', true]
    ]
    : [
      ['color', VIDEASY_COLOR],
      ['overlay', true]
    ];
  const normalizedProgress = normalizeProgress(progress);

  if (normalizedProgress > 0) {
    params.push(['progress', normalizedProgress]);
  }

  return buildUrl(path, params);
};
