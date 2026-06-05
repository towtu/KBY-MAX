export const getDisplayYear = (movie = {}) => {
  const date = movie.release_date || movie.first_air_date;
  return date ? String(new Date(date).getFullYear()) : '';
};

export const getRuntimeLabel = (movie = {}) => {
  if (movie.runtime) return `${movie.runtime} min`;
  const episodeRuntime = movie.episode_run_time?.[0];
  return episodeRuntime ? `${episodeRuntime} min episodes` : '';
};

export const getScoreLabel = (movie = {}) => {
  return movie.vote_average ? `Score ${Number(movie.vote_average).toFixed(1)}` : 'Not rated';
};

export const getAnimePlayerEpisode = ({ format = '', selectedEpisode = 1 } = {}) => {
  return String(format).toUpperCase() === 'MOVIE' ? undefined : selectedEpisode || 1;
};
