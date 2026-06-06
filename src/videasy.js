export const VIDEASY_BASE_URL = 'https://player.videasy.to';
export const VIDLINK_BASE_URL = 'https://vidlink.pro';
export const VIDEASY_COLOR = '17c3d1';
export const VIDLINK_SECONDARY_COLOR = '101720';
export const VIDLINK_ICON_COLOR = 'f8fafc';

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

const buildExternalUrl = (baseUrl, path, params) => {
  const search = new URLSearchParams();

  params.forEach(([key, value]) => {
    if (value === undefined || value === null || value === false || value === '') return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return `${baseUrl}${path}${query ? `?${query}` : ''}`;
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

const vidLinkParams = ({ progress = 0, nextbutton = false } = {}) => {
  const params = [
    ['primaryColor', VIDEASY_COLOR],
    ['secondaryColor', VIDLINK_SECONDARY_COLOR],
    ['iconColor', VIDLINK_ICON_COLOR],
    ['icons', 'default'],
    ['player', 'default'],
    ['title', 'true'],
    ['poster', 'true'],
    ['autoplay', 'false'],
    ['nextbutton', nextbutton]
  ];
  const normalizedProgress = normalizeProgress(progress);

  if (normalizedProgress > 0) {
    params.push(['startAt', normalizedProgress]);
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

export const buildVidLinkMovieUrl = ({ id, progress = 0 }) => {
  return buildExternalUrl(VIDLINK_BASE_URL, `/movie/${id}`, vidLinkParams({ progress }));
};

export const buildVidLinkTvUrl = ({ id, season = 1, episode = 1, progress = 0 }) => {
  return buildExternalUrl(
    VIDLINK_BASE_URL,
    `/tv/${id}/${season || 1}/${episode || 1}`,
    vidLinkParams({ progress, nextbutton: true })
  );
};

export const buildPlayerOptions = ({
  mediaType,
  id,
  season = 1,
  episode = 1,
  progress = 0
}) => {
  const vidLinkSrc = mediaType === 'tv'
    ? buildVidLinkTvUrl({ id, season, episode, progress })
    : buildVidLinkMovieUrl({ id, progress });
  const videasySrc = mediaType === 'tv'
    ? buildVideasyTvUrl({ id, season, episode, progress })
    : buildVideasyMovieUrl({ id, progress });

  return [
    { id: 'vidlink', label: 'Server 1', name: 'VidLink', src: vidLinkSrc },
    { id: 'videasy', label: 'Server 2', name: 'Videasy', src: videasySrc }
  ].filter((option) => option.src);
};
