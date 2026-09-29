import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Calendar, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAnimeDetails, getImageUrl } from '../api';
import MovieCard from '../components/MovieCard';
import { saveResumeItem } from '../localResume';
import { getMovieTitle } from '../movieLinks';
import { buildPlayerOptions } from '../playerUrls';
import './MovieDetail.css';

const getProgressKey = ({ id, episode }) => {
  return `movie_progress_anime_${id}_1_${episode || 1}`;
};

export default function AnimeDetail() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const episodeRailRef = useRef(null);

  const progressKey = useMemo(() => getProgressKey({
    id,
    episode: selectedEpisode
  }), [id, selectedEpisode]);

  const startProgress = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    const savedProgress = window.localStorage.getItem(progressKey);
    return savedProgress ? Math.floor(parseFloat(savedProgress)) : 0;
  }, [progressKey]);

  useEffect(() => {
    let active = true;

    const loadAnime = async () => {
      try {
        setLoading(true);
        setSelectedEpisode(1);

        const data = await fetchAnimeDetails(id);
        if (!active) return;
        setAnime(data);
      } catch (error) {
        console.error('Failed to load anime details', error);
        if (active) setAnime(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAnime();
    window.scrollTo(0, 0);

    return () => {
      active = false;
    };
  }, [id]);

  const scrollEpisodeRail = useCallback((railRef, direction) => {
    const rail = railRef.current;
    if (!rail) return;

    const firstCard = rail.querySelector('button');
    const styles = window.getComputedStyle(rail);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const cardWidth = firstCard?.getBoundingClientRect().width || rail.clientWidth * 0.65;
    const scrollDistance = Math.max(cardWidth + gap, rail.clientWidth * 0.72);

    rail.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth'
    });
  }, []);

  const renderEpisodeRailControls = (railRef, label) => (
    <>
      <button
        type="button"
        className="episode-rail-control left"
        aria-label={`Scroll ${label} left`}
        onClick={() => scrollEpisodeRail(railRef, 'left')}
      >
        <ChevronLeft size={28} />
      </button>
      <button
        type="button"
        className="episode-rail-control right"
        aria-label={`Scroll ${label} right`}
        onClick={() => scrollEpisodeRail(railRef, 'right')}
      >
        <ChevronRight size={28} />
      </button>
    </>
  );

  useEffect(() => {
    const handlePlayerMessage = (event) => {
      if (event.origin !== 'https://zoryva.me') return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data?.type === 'PLAYER_EVENT' && data?.data) {
          const payload = data.data;
          if (payload.event === 'timeupdate' || payload.event === 'seeked' || payload.event === 'pause') {
            const progress = Number(payload.currentTime);
            if (!Number.isFinite(progress) || progress <= 0) return;

            window.localStorage.setItem(progressKey, progress.toString());
            if (anime) {
              saveResumeItem({
                id: anime.id,
                mediaType: 'anime',
                title: getMovieTitle(anime),
                posterPath: anime.poster_path,
                backdropPath: anime.backdrop_path,
                progress,
                updatedAt: Date.now()
              });
            }
          }
        }
      } catch {
        // Ignore JSON parse errors from unrelated window messages.
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [anime, progressKey]);

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>;
  }

  if (!anime) {
    return <div className="container"><h2 style={{ marginTop: '100px' }}>Anime not found</h2></div>;
  }

  const title = getMovieTitle(anime);
  const year = anime.first_air_date ? String(new Date(anime.first_air_date).getFullYear()) : '';
  const scoreLabel = anime.vote_average ? `Score ${Number(anime.vote_average).toFixed(1)}` : 'Not rated';
  const episodeCount = anime.episode_count || anime.episodes || 0;
  const runtimeLabel = anime.duration ? `${anime.duration} min/ep` : (episodeCount ? `${episodeCount} episodes` : '');
  const studioNames = anime.studios?.map(s => s.name).filter(Boolean) || [];

  const episodes = Array.from({ length: episodeCount }, (_, i) => ({
    episode_number: i + 1
  }));

  const iframeSrc = buildPlayerOptions({
    mediaType: 'anime',
    id: anime.id,
    season: 1,
    episode: selectedEpisode,
    progress: startProgress
  })[0]?.src || '';

  const recommendationItems = (anime.recommendations || []).slice(0, 12);
  const characters = anime.characters || [];

  return (
    <div className="movie-detail animate-fade-in">
      {anime.backdrop_path && (
        <div className="detail-backdrop" aria-hidden="true">
          <img src={getImageUrl(anime.backdrop_path, true)} alt="" />
        </div>
      )}

      <div className="container detail-content">
        <Link to="/" className="detail-back-link">
          <ArrowLeft size={18} /> Back to home
        </Link>

        <section className="detail-lobby">
          <div className="detail-poster-panel">
            {anime.poster_path ? (
              <img src={getImageUrl(anime.poster_path)} alt={title} />
            ) : (
              <span>{title}</span>
            )}
          </div>

          <div className="detail-copy">
            <p className="detail-eyebrow">Now streaming on KBY MAX</p>
            <h1 className="detail-title">{title}</h1>

            <div className="detail-meta">
              <span className="meta-item meta-score">
                <Star size={16} fill="currentColor" />
                {scoreLabel}
              </span>
              {year && (
                <span className="meta-item">
                  <Calendar size={16} />
                  {year}
                </span>
              )}
              {runtimeLabel && (
                <span className="meta-item">
                  <Clock size={16} />
                  {runtimeLabel}
                </span>
              )}
              <span className="meta-item">Anime</span>
            </div>

            {anime.genres?.length > 0 && (
              <div className="detail-genres">
                {anime.genres.map(genre => (
                  <span key={genre.name || genre} className="genre-tag">
                    {typeof genre === 'string' ? genre : genre.name}
                  </span>
                ))}
              </div>
            )}

            <div className="detail-overview">
              <p>{anime.overview || 'No overview is available yet for this title.'}</p>
            </div>

            {studioNames.length > 0 && (
              <div className="detail-facts detail-facts-inline">
                {studioNames.map((name) => (
                  <div key={name} className="fact-item">
                    <span>Studio</span>
                    <strong>{name}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="detail-actions">
              <a href="#watch" className="btn btn-primary detail-action">
                <Play size={20} fill="currentColor" /> Watch now
              </a>
            </div>
          </div>
        </section>

        <section id="watch" className="movie-player-section">
          <div className="player-heading">
            <div>
              <p className="detail-eyebrow">Theatre mode</p>
              <h2>Watch {title}</h2>
            </div>
          </div>

          {episodeCount > 1 && (
            <div className="episode-panel">
              <div className="season-tabs" aria-label="Season">
                <button type="button" className="active">Season 1</button>
              </div>

              <div className="episode-rail-shell">
                {renderEpisodeRailControls(episodeRailRef, 'episodes')}
                <div ref={episodeRailRef} className="episode-strip" aria-label="Select episode">
                  {episodes.map((episode) => (
                    <button
                      key={episode.episode_number}
                      type="button"
                      className={`episode-card ${selectedEpisode === episode.episode_number ? 'active' : ''}`}
                      onClick={() => setSelectedEpisode(episode.episode_number)}
                    >
                      <span className="episode-placeholder">E{episode.episode_number}</span>
                      <span>Episode {episode.episode_number}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="video-container">
            <iframe
              key={iframeSrc}
              src={iframeSrc}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; picture-in-picture"
              style={{ border: 0, borderRadius: '12px' }}
              title={`Watch ${title}`}
            ></iframe>
          </div>
        </section>

        {recommendationItems.length > 0 && (
          <section className="recommendations-section">
            <div className="section-heading">
              <p className="detail-eyebrow">More like this</p>
              <h2>Recommended next</h2>
            </div>
            <div className="detail-card-row">
              {recommendationItems.map((item) => (
                <div key={`anime-${item.id}`} className="detail-card-cell">
                  <MovieCard movie={item} />
                </div>
              ))}
            </div>
          </section>
        )}

        {characters.length > 0 && (
          <section className="cast-section">
            <div className="section-heading">
              <p className="detail-eyebrow">Characters</p>
              <h2>Main cast</h2>
            </div>
            <div className="cast-list">
              {characters.slice(0, 8).map((character, index) => (
                <div key={character.name?.full || index} className="cast-item">
                  {character.image?.large ? (
                    <img src={character.image.large} alt={character.name?.full || ''} />
                  ) : (
                    <div className="cast-placeholder">{(character.name?.full || '?').charAt(0)}</div>
                  )}
                  <span className="cast-name">{character.name?.full || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
