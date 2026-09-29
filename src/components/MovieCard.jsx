import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Play, Plus, Star } from 'lucide-react';
import { getImageUrl, fetchGenres } from '../api';
import { getMediaLink, getMediaType, getMovieTitle } from '../movieLinks';
import './MovieCard.css';

export default function MovieCard({ movie }) {
  const [genres, setGenres] = useState({});

  useEffect(() => {
    const loadGenres = async () => {
      const genreMap = await fetchGenres();
      setGenres(genreMap);
    };
    loadGenres();
  }, []);

  const directGenres = movie.genres?.map((genre) => (
    typeof genre === 'string' ? genre : genre?.name
  )).filter(Boolean) || [];
  const movieGenres = directGenres.length > 0
    ? directGenres.slice(0, 2)
    : movie.genre_ids?.map(id => genres[id]).filter(Boolean).slice(0, 2) || [];
  
  const title = getMovieTitle(movie);
  const mediaType = getMediaType(movie);
  const mediaLabel = mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'Series' : 'Movie';
  const linkTo = getMediaLink(movie);
  const date = movie.release_date || movie.first_air_date;
  const year = date ? new Date(date).getFullYear() : '';
  const score = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;
  const previewImage = movie.backdrop_path || movie.poster_path;

  return (
    <article className="movie-card">
      <Link to={linkTo} className="card-poster-link" aria-label={`Open ${title}`}>
        <div className="card-image-wrapper">
          {movie.poster_path ? (
            <img
              src={getImageUrl(movie.poster_path)}
              alt={title}
              className="card-image"
              loading="lazy"
            />
          ) : (
            <div className="card-image-placeholder">{title}</div>
          )}
          <div className="card-overlay">
            <div className="play-icon-overlay">
              <Play size={42} fill="currentColor" />
            </div>
            <div className="card-overlay-bottom">
              <h4 className="hover-title">{title}</h4>
              <div className="card-genres-overlay">
                {movieGenres.map(g => (
                  <span key={g} className="card-genre-pill">{g}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="rating-badge">
            <Star className="star-icon" size={12} fill="currentColor" />
            <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
          </div>
        </div>
      </Link>

      <div className="card-hover-preview">
        <Link to={linkTo} className="preview-art" aria-label={`Open ${title}`}>
          {previewImage ? (
            <img
              src={getImageUrl(previewImage, !!movie.backdrop_path)}
              alt={title}
              loading="lazy"
            />
          ) : (
            <span>{title}</span>
          )}
        </Link>

        <div className="preview-body">
          <div className="preview-actions">
            <Link to={linkTo} className="preview-action preview-action-primary" aria-label={`Play ${title}`}>
              <Play size={18} fill="currentColor" />
            </Link>
            <button type="button" className="preview-action" aria-label={`Add ${title} to my list`}>
              <Plus size={18} />
            </button>
            <button type="button" className="preview-action" aria-label={`Rate ${title}`}>
              <Star size={17} />
            </button>
            <Link to={linkTo} className="preview-action preview-action-more" aria-label={`More info about ${title}`}>
              <ChevronDown size={20} />
            </Link>
          </div>

          <Link to={linkTo} className="preview-title">{title}</Link>
          <div className="preview-meta">
            {score && <span className="preview-score">Score {score}</span>}
            {year && <span>{year}</span>}
            <span>{mediaLabel}</span>
          </div>

          {movieGenres.length > 0 && (
            <div className="preview-genres">
              {movieGenres.map(g => (
                <span key={g}>{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
