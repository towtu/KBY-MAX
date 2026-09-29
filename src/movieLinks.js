export const getMovieTitle = (movie = {}) => movie.title || movie.name || 'Untitled';

export const getMediaType = (movie = {}) => {
  if (movie.media_type === 'anime' || movie.mediaType === 'anime') return 'anime';
  if (movie.media_type === 'tv' || movie.mediaType === 'tv') return 'tv';
  if (movie.media_type === 'movie' || movie.mediaType === 'movie') return 'movie';
  return movie.name ? 'tv' : 'movie';
};

export const getMediaLink = (movie = {}) => {
  const mediaType = getMediaType(movie);
  if (mediaType === 'anime') return `/anime/${movie.id}`;
  return mediaType === 'tv' ? `/tv/${movie.id}` : `/movie/${movie.id}`;
};
