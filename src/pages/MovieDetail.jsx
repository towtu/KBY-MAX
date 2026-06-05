import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Calendar, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  fetchAnimeDetails,
  fetchMovieDetails,
  fetchSeasonDetails,
  fetchTVDetails,
  getImageUrl
} from '../api';
import MovieCard from '../components/MovieCard';
import { saveResumeItem } from '../localResume';
import { getMovieTitle } from '../movieLinks';
import { getDisplayYear, getRuntimeLabel, getScoreLabel } from '../movieDetailMeta';
import {
  buildVidLinkAnimeUrl,
  buildVidLinkMovieUrl,
  buildVidLinkTvUrl,
  buildVideasyAnimeUrl,
  buildVideasyMovieUrl,
  buildVideasyTvUrl
} from '../videasy';
import './MovieDetail.css';

const getProgressKey = ({ mediaType, id, season, episode }) => {
  if (mediaType === 'tv') return `movie_progress_tv_${id}_${season || 1}_${episode || 1}`;
  if (mediaType === 'anime') return `movie_progress_anime_${id}_${episode || 'movie'}`;
  return `movie_progress_movie_${id}`;
};

const getRecommendationItems = (movie = {}) => {
  const items = [
    ...(movie.recommendations?.results || []),
    ...(movie.similar?.results || [])
  ];
  const seen = new Set();

  return items.filter((item) => {
    if (!item?.id) return false;
    const key = `${item.media_type || (item.name ? 'tv' : 'movie')}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return item.poster_path || item.backdrop_path || item.title || item.name;
  });
};

const getCrewFacts = (movie = {}, mediaType) => {
  const facts = [];

  movie.created_by?.forEach((person) => {
    facts.push({ label: 'Creator', name: person.name, id: `creator-${person.id}` });
  });

  movie.credits?.crew
    ?.filter((person) => ['Director', 'Creator', 'Writer', 'Screenplay'].includes(person.job))
    ?.forEach((person) => {
      facts.push({ label: person.job, name: person.name, id: `${person.job}-${person.id}` });
    });

  if (mediaType === 'anime') {
    if (movie.format) facts.push({ label: 'Format', name: movie.format.replace(/_/g, ' '), id: 'anime-format' });
    if (movie.episodes) facts.push({ label: 'Episodes', name: String(movie.episodes), id: 'anime-episodes' });
    if (movie.status) facts.push({ label: 'Status', name: movie.status.replace(/_/g, ' '), id: 'anime-status' });
  }

  const seen = new Set();
  return facts.filter((fact) => {
    const key = `${fact.label}-${fact.name}`;
    if (!fact.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
};

export default function MovieDetail({ isTV = false, isAnime = false }) {
  const { id } = useParams();
  const mediaType = isAnime ? 'anime' : isTV ? 'tv' : 'movie';
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [selectedAnimeEpisode, setSelectedAnimeEpisode] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const tvEpisodeRailRef = useRef(null);
  const animeEpisodeRailRef = useRef(null);

  const progressKey = useMemo(() => getProgressKey({
    mediaType,
    id,
    season: selectedSeason,
    episode: mediaType === 'anime' ? selectedAnimeEpisode : selectedEpisode
  }), [id, mediaType, selectedAnimeEpisode, selectedEpisode, selectedSeason]);

  const startProgress = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    const savedProgress = window.localStorage.getItem(progressKey);
    return savedProgress ? Math.floor(parseFloat(savedProgress)) : 0;
  }, [progressKey]);

  useEffect(() => {
    let active = true;

    const loadMovie = async () => {
      try {
        setLoading(true);
        setSeasons([]);
        setEpisodes([]);
        setSelectedSeason(1);
        setSelectedEpisode(1);
        setSelectedAnimeEpisode(1);
        setSelectedPlayerId('');

        const data = isAnime
          ? await fetchAnimeDetails(id)
          : isTV
            ? await fetchTVDetails(id)
            : await fetchMovieDetails(id);

        if (!active) return;
        setMovie(data);

        if (isTV) {
          const nextSeasons = (data.seasons || []).filter((season) => season.season_number > 0);
          const firstSeason = nextSeasons[0]?.season_number || 1;
          setSeasons(nextSeasons);
          setSelectedSeason(firstSeason);
          setSelectedEpisode(1);

          try {
            const seasonDetails = await fetchSeasonDetails(id, firstSeason);
            if (active) setEpisodes(seasonDetails.episodes || []);
          } catch (seasonError) {
            console.error('Failed to load season details', seasonError);
            if (active) setEpisodes([]);
          }
        }
      } catch (error) {
        console.error('Failed to load title details', error);
        if (active) setMovie(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMovie();
    window.scrollTo(0, 0);

    return () => {
      active = false;
    };
  }, [id, isAnime, isTV]);

  const handleSeasonChange = useCallback(async (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1);
    setEpisodes([]);

    try {
      const seasonDetails = await fetchSeasonDetails(id, seasonNumber);
      setEpisodes(seasonDetails.episodes || []);
    } catch (error) {
      console.error('Failed to load season details', error);
      setEpisodes([]);
    }
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
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (data?.type === 'PLAYER_EVENT' && data?.data) {
          const payload = data.data;
          if (payload.event === 'timeupdate' || payload.event === 'seeked' || payload.event === 'pause') {
            const progress = Number(payload.currentTime);
            if (!Number.isFinite(progress) || progress <= 0) return;

            window.localStorage.setItem(progressKey, progress.toString());
            if (movie) {
              saveResumeItem({
                id: movie.id,
                mediaType,
                title: getMovieTitle(movie),
                posterPath: movie.poster_path,
                backdropPath: movie.backdrop_path,
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
  }, [mediaType, movie, progressKey]);

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>;
  }

  if (!movie) {
    return <div className="container"><h2 style={{ marginTop: '100px' }}>Title not found</h2></div>;
  }

  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const title = getMovieTitle(movie);
  const year = getDisplayYear(movie);
  const runtimeLabel = getRuntimeLabel(movie);
  const scoreLabel = getScoreLabel(movie);
  const mediaLabel = mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'Series' : 'Movie';
  const animeEpisodeCards = movie.animeEpisodes?.length > 0
    ? movie.animeEpisodes
    : [{ episode_number: 1, name: 'Episode 1', still_path: movie.backdrop_path || movie.poster_path }];
  const hasAnimeEpisodes = mediaType === 'anime' && animeEpisodeCards.length > 1;
  const videasySrc = mediaType === 'anime'
    ? buildVideasyAnimeUrl({
      id: movie.id,
      episode: hasAnimeEpisodes ? selectedAnimeEpisode : undefined,
      progress: startProgress
    })
    : mediaType === 'tv'
      ? buildVideasyTvUrl({
        id: movie.id,
        season: selectedSeason,
        episode: selectedEpisode,
        progress: startProgress
      })
      : buildVideasyMovieUrl({
        id: movie.id,
        progress: startProgress
      });
  const vidLinkSrc = mediaType === 'anime'
    ? movie.mal_id
      ? buildVidLinkAnimeUrl({
        malId: movie.mal_id,
        episode: hasAnimeEpisodes ? selectedAnimeEpisode : 1,
        progress: startProgress
      })
      : ''
    : mediaType === 'tv'
      ? buildVidLinkTvUrl({
        id: movie.id,
        season: selectedSeason,
        episode: selectedEpisode,
        progress: startProgress
      })
      : buildVidLinkMovieUrl({
        id: movie.id,
        progress: startProgress
      });
  const playerOptions = [
    ...(mediaType === 'movie'
      ? [
        { id: 'videasy', label: 'Server 1', name: 'Videasy', src: videasySrc },
        { id: 'vidlink', label: 'Server 2', name: 'VidLink', src: vidLinkSrc }
      ]
      : [
        ...(vidLinkSrc ? [{ id: 'vidlink', label: 'Server 1', name: 'VidLink', src: vidLinkSrc }] : []),
        { id: 'videasy', label: vidLinkSrc ? 'Server 2' : 'Server 1', name: 'Videasy', src: videasySrc }
      ])
  ].filter((option) => option.src);
  const selectedPlayer = playerOptions.find((option) => option.id === selectedPlayerId) || playerOptions[0];
  const iframeSrc = selectedPlayer?.src || videasySrc;
  const crewFacts = getCrewFacts(movie, mediaType);
  const recommendationItems = getRecommendationItems(movie).slice(0, 12);

  return (
    <div className="movie-detail animate-fade-in">
      {movie.backdrop_path && (
        <div className="detail-backdrop" aria-hidden="true">
          <img src={getImageUrl(movie.backdrop_path, true)} alt="" />
        </div>
      )}

      <div className="container detail-content">
        <Link to="/" className="detail-back-link">
          <ArrowLeft size={18} /> Back to home
        </Link>

        <section className="detail-lobby">
          <div className="detail-poster-panel">
            {movie.poster_path ? (
              <img src={getImageUrl(movie.poster_path)} alt={title} />
            ) : (
              <span>{title}</span>
            )}
          </div>

          <div className="detail-copy">
            <p className="detail-eyebrow">Now streaming on KBY MAX</p>
            <h1 className="detail-title">{title}</h1>
            {movie.tagline && <p className="detail-tagline">{movie.tagline}</p>}

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
              <span className="meta-item">{mediaLabel}</span>
            </div>

            {movie.genres?.length > 0 && (
              <div className="detail-genres">
                {movie.genres.map(genre => (
                  <span key={genre.id || genre.name} className="genre-tag">{genre.name}</span>
                ))}
              </div>
            )}

            <div className="detail-overview">
              <p>{movie.overview || 'No overview is available yet for this title.'}</p>
            </div>

            {crewFacts.length > 0 && (
              <div className="detail-facts detail-facts-inline">
                {crewFacts.map((fact) => (
                  <div key={fact.id} className="fact-item">
                    <span>{fact.label}</span>
                    <strong>{fact.name}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="detail-actions">
              <a href="#watch" className="btn btn-primary detail-action">
                <Play size={20} fill="currentColor" /> Watch now
              </a>
              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary detail-action"
                >
                  <Play size={19} fill="currentColor" /> Trailer
                </a>
              )}
            </div>
          </div>
        </section>

        <section id="watch" className="movie-player-section">
          <div className="player-heading">
            <div>
              <p className="detail-eyebrow">Theatre mode</p>
              <h2>Watch {title}</h2>
            </div>
            <div className="player-server-group" aria-label="Choose streaming server">
              {playerOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`player-server ${selectedPlayer?.id === option.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlayerId(option.id)}
                >
                  <span>{option.label}</span>
                  <strong>{option.name}</strong>
                </button>
              ))}
            </div>
          </div>

          {mediaType === 'tv' && seasons.length > 0 && (
            <div className="episode-panel">
              <div className="season-tabs" aria-label="Select season">
                {seasons.map((season) => (
                  <button
                    key={season.id || season.season_number}
                    type="button"
                    className={selectedSeason === season.season_number ? 'active' : ''}
                    onClick={() => handleSeasonChange(season.season_number)}
                  >
                    S{season.season_number}
                  </button>
                ))}
              </div>

              {episodes.length > 0 && (
                <div className="episode-rail-shell">
                  {renderEpisodeRailControls(tvEpisodeRailRef, 'episodes')}
                  <div ref={tvEpisodeRailRef} className="episode-strip" aria-label="Select episode">
                    {episodes.map((episode) => (
                      <button
                        key={episode.id || episode.episode_number}
                        type="button"
                        className={`episode-card ${selectedEpisode === episode.episode_number ? 'active' : ''}`}
                        onClick={() => setSelectedEpisode(episode.episode_number)}
                      >
                        {episode.still_path ? (
                          <img src={getImageUrl(episode.still_path)} alt="" loading="lazy" />
                        ) : (
                          <span className="episode-placeholder">E{episode.episode_number}</span>
                        )}
                        <span>Episode {episode.episode_number}</span>
                        <strong>{episode.name || `Episode ${episode.episode_number}`}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasAnimeEpisodes && (
            <div className="anime-episode-panel" aria-label="Select anime episode">
              <div className="season-tabs anime-season-tabs" aria-label="Anime season">
                <button type="button" className="active">S1</button>
              </div>
              <div className="episode-rail-shell">
                {renderEpisodeRailControls(animeEpisodeRailRef, 'anime episodes')}
                <div ref={animeEpisodeRailRef} className="anime-episode-strip" aria-label="Select anime episode">
                  {animeEpisodeCards.map((episode) => (
                    <button
                      key={episode.episode_number}
                      type="button"
                      className={`anime-episode-card ${selectedAnimeEpisode === episode.episode_number ? 'active' : ''}`}
                      onClick={() => setSelectedAnimeEpisode(episode.episode_number)}
                      aria-label={`Episode ${episode.episode_number}`}
                    >
                      {episode.still_path ? (
                        <img src={getImageUrl(episode.still_path)} alt="" loading="lazy" />
                      ) : (
                        <span className="episode-placeholder">E{episode.episode_number}</span>
                      )}
                      <span>Episode {episode.episode_number}</span>
                      <strong>{episode.name || `Episode ${episode.episode_number}`}</strong>
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
              allow="encrypted-media; autoplay; picture-in-picture"
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
                <div key={`${item.media_type || (item.name ? 'tv' : mediaType)}-${item.id}`} className="detail-card-cell">
                  <MovieCard movie={item} />
                </div>
              ))}
            </div>
          </section>
        )}

        {movie.credits?.cast?.length > 0 && (
          <section className="cast-section">
            <div className="section-heading">
              <p className="detail-eyebrow">Cast</p>
              <h2>Top billed</h2>
            </div>
            <div className="cast-list">
              {movie.credits.cast.slice(0, 8).map(actor => (
                <div key={actor.id} className="cast-item">
                  {actor.profile_path ? (
                    <img src={getImageUrl(actor.profile_path)} alt={actor.name} />
                  ) : (
                    <div className="cast-placeholder">{actor.name.charAt(0)}</div>
                  )}
                  <span className="cast-name">{actor.name}</span>
                  <span className="cast-character">{actor.character}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
