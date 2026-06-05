import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import {
  fetchDiscoverMovies,
  fetchTrendingAnime,
  fetchKDramas,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchTrendingMovies,
  fetchTrendingTV,
  getImageUrl
} from '../api';
import { getResumeItems } from '../localResume';
import { buildHomeRows, MOVIE_CATEGORY_ROWS } from '../homeRows';
import { getMediaLink, getMovieTitle } from '../movieLinks';
import MovieCard from '../components/MovieCard';
import './Home.css';

const EMPTY_HOME_DATA = {
  heroItems: [],
  topTen: [],
  trendingMovies: [],
  trendingShows: [],
  trendingAnime: [],
  kDramas: [],
  topRated: [],
  categoryRows: []
};

const getSettledResults = (settled) => {
  if (settled.status !== 'fulfilled') return [];
  return settled.value?.results || [];
};

const resumeItemToMovie = (item) => ({
  id: item.id,
  media_type: item.mediaType,
  title: item.mediaType === 'tv' ? undefined : item.title,
  name: item.mediaType === 'tv' ? item.title : undefined,
  poster_path: item.posterPath,
  backdrop_path: item.backdropPath,
  vote_average: null,
  progress: item.progress
});

const formatProgress = (seconds) => {
  const minutes = Math.max(1, Math.floor(Number(seconds) / 60));
  return `${minutes} min watched`;
};

const HERO_CAROUSEL_OFFSETS = [-1, 0, 1, 2];

const getHeroSlotClass = (offset) => {
  if (offset === 0) return 'is-active';
  if (offset === 1) return 'is-next';
  if (offset === -1) return 'is-prev';
  return 'is-queue';
};

const getHeroCarouselItems = (items, activeIndex) => {
  if (!items.length) return [];

  const used = new Set();

  return HERO_CAROUSEL_OFFSETS
    .map((offset) => {
      const itemIndex = (activeIndex + offset + items.length) % items.length;
      const item = items[itemIndex];
      const key = `${item.media_type || item.mediaType || 'movie'}-${item.id}`;

      if (used.has(key)) return null;
      used.add(key);

      return { item, offset };
    })
    .filter(Boolean);
};

export default function Home() {
  const [homeData, setHomeData] = useState(EMPTY_HOME_DATA);
  const [resumeItems, setResumeItems] = useState(() => getResumeItems());
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError('');
      setResumeItems(getResumeItems());

      const categoryRequests = MOVIE_CATEGORY_ROWS.map((row) => {
        return fetchDiscoverMovies({
          withGenres: row.withGenres,
          sortBy: row.sortBy
        }).then((data) => ({
          ...row,
          items: data.results || [],
          note: 'Curated by genre'
        }));
      });

      const [
        heroSettled,
        topTenSettled,
        trendingMoviesSettled,
        trendingShowsSettled,
        trendingAnimeSettled,
        kDramasSettled,
        topRatedSettled,
        categoryRowsSettled
      ] = await Promise.allSettled([
        fetchTrending(),
        fetchPopular(),
        fetchTrendingMovies(),
        fetchTrendingTV(),
        fetchTrendingAnime(),
        fetchKDramas(),
        fetchTopRated(),
        Promise.allSettled(categoryRequests)
      ]);

      const nextData = {
        heroItems: getSettledResults(heroSettled),
        topTen: getSettledResults(topTenSettled),
        trendingMovies: getSettledResults(trendingMoviesSettled),
        trendingShows: getSettledResults(trendingShowsSettled),
        trendingAnime: getSettledResults(trendingAnimeSettled),
        kDramas: getSettledResults(kDramasSettled),
        topRated: getSettledResults(topRatedSettled),
        categoryRows: categoryRowsSettled.status === 'fulfilled'
          ? categoryRowsSettled.value
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value)
          : []
      };

      const hasContent = [
        nextData.heroItems,
        nextData.topTen,
        nextData.trendingMovies,
        nextData.trendingShows,
        nextData.trendingAnime,
        nextData.kDramas,
        nextData.topRated,
        ...nextData.categoryRows.map((row) => row.items)
      ].some((items) => items.length > 0);

      setHomeData(nextData);
      setLoadError(hasContent ? '' : 'We could not load movies right now. Please try again.');
      setLoading(false);
    };

    loadData().catch((error) => {
      console.error("Failed to load movies", error);
      setHomeData(EMPTY_HOME_DATA);
      setLoadError('We could not load movies right now. Please try again.');
      setLoading(false);
    });
  }, [reloadKey]);

  const heroItems = useMemo(() => {
    return homeData.heroItems.length > 0 ? homeData.heroItems : homeData.trendingMovies;
  }, [homeData.heroItems, homeData.trendingMovies]);

  const rows = useMemo(() => {
    return buildHomeRows({
      topTen: homeData.topTen.slice(0, 10),
      resumeItems: resumeItems.map(resumeItemToMovie),
      trendingMovies: homeData.trendingMovies.slice(0, 18),
      trendingShows: homeData.trendingShows.slice(0, 18),
      trendingAnime: homeData.trendingAnime.slice(0, 18),
      kDramas: homeData.kDramas.slice(0, 18),
      topRated: homeData.topRated.slice(0, 18),
      categoryRows: homeData.categoryRows.map((row) => ({
        ...row,
        items: row.items.slice(0, 18)
      }))
    });
  }, [homeData, resumeItems]);

  useEffect(() => {
    if (heroItems.length === 0) return undefined;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(heroItems.length, 5));
    }, 10000);
    return () => clearInterval(interval);
  }, [heroItems]);

  const scrollRow = (id, direction) => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = direction === 'left' ? -container.offsetWidth * 0.85 : container.offsetWidth * 0.85;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const renderScrollButtons = (id) => (
    <>
      <button className="row-btn left" aria-label="Scroll left" onClick={() => scrollRow(id, 'left')}>
        <ChevronLeft size={28} />
      </button>
      <button className="row-btn right" aria-label="Scroll right" onClick={() => scrollRow(id, 'right')}>
        <ChevronRight size={28} />
      </button>
    </>
  );

  const renderSectionHeader = (row) => (
    <div className="section-header container">
      <div>
        <p className="section-kicker">{row.note || 'KBY MAX'}</p>
        <h2 className="section-title">{row.title}</h2>
      </div>
      {row.browsePath && (
        <Link to={row.browsePath} className="see-all">
          Explore <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );

  const renderPosterRow = (row) => (
    <section className="movie-section" key={row.id}>
      {renderSectionHeader(row)}
      <div className="row-container">
        {renderScrollButtons(`row-${row.id}`)}
        <div className="movie-row" id={`row-${row.id}`}>
          {row.items.map((movie) => (
            <div key={`${row.id}-${movie.media_type || movie.mediaType || 'movie'}-${movie.id}`} className="row-item">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderRankedRow = (row) => (
    <section className="movie-section ranked-section" key={row.id}>
      {renderSectionHeader(row)}
      <div className="row-container">
        {renderScrollButtons(`row-${row.id}`)}
        <div className="movie-row ranked-row" id={`row-${row.id}`}>
          {row.items.map((movie, index) => (
            <div key={`${row.id}-${movie.media_type || movie.mediaType || 'movie'}-${movie.id}`} className="rank-card">
              <span className="rank-badge">{index + 1}</span>
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderResumeRow = (row) => (
    <section className="movie-section" key={row.id}>
      {renderSectionHeader(row)}
      <div className="row-container">
        {renderScrollButtons(`row-${row.id}`)}
        <div className="movie-row resume-row" id={`row-${row.id}`}>
          {row.items.map((movie) => (
            <Link key={`${row.id}-${movie.media_type}-${movie.id}`} to={getMediaLink(movie)} className="resume-card">
              <div className="resume-poster">
                {movie.poster_path ? (
                  <img src={getImageUrl(movie.poster_path)} alt={getMovieTitle(movie)} loading="lazy" />
                ) : (
                  <span>{getMovieTitle(movie)}</span>
                )}
              </div>
              <div className="resume-info">
                <h3>{getMovieTitle(movie)}</h3>
                <p>{formatProgress(movie.progress)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  const renderRow = (row) => {
    if (row.type === 'ranked') return renderRankedRow(row);
    if (row.type === 'resume') return renderResumeRow(row);
    return renderPosterRow(row);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (loadError && rows.length === 0) {
    return (
      <div className="home-page">
        <section className="home-error container">
          <h1>Movies did not load</h1>
          <p>{loadError}</p>
          <button className="btn btn-primary" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw size={18} /> Retry
          </button>
        </section>
      </div>
    );
  }

  const activeHeroIndex = heroIndex % Math.max(heroItems.length, 1);
  const heroMovie = heroItems[activeHeroIndex];
  const heroLink = heroMovie ? getMediaLink(heroMovie) : '#';
  const heroCarouselItems = getHeroCarouselItems(heroItems, activeHeroIndex);
  const heroBackdropPath = heroMovie?.backdrop_path || heroMovie?.poster_path;

  return (
    <div className="home-page animate-fade-in">
      {heroMovie && (
        <section className="hero-section">
          {heroBackdropPath && (
            <div className="hero-backdrop" key={`hero-backdrop-${heroMovie.id}`} aria-hidden="true">
              <img
                src={getImageUrl(heroBackdropPath, !!heroMovie.backdrop_path)}
                alt=""
              />
            </div>
          )}
          <div className="container hero-layout">
            <div className="hero-content" key={`hero-copy-${heroMovie.id}`}>
              <p className="hero-kicker">Featured tonight</p>
              <h1 className="hero-title" key={`title-${heroMovie.id}`}>
                {getMovieTitle(heroMovie)}
              </h1>
              <p className="hero-overview" key={`desc-${heroMovie.id}`}>
                {heroMovie.overview || 'A featured pick from the latest KBY MAX lineup.'}
              </p>
              <div className="hero-actions">
                <Link to={heroLink} className="btn btn-primary">
                  <Play size={22} fill="currentColor" /> Play
                </Link>
                <Link to={heroLink} className="btn btn-secondary">
                  <Info size={22} /> More Info
                </Link>
              </div>
            </div>

            <div className="hero-media" aria-label="Featured movie artwork">
              <div className="hero-carousel-stage">
                {heroCarouselItems.map(({ item, offset }) => {
                  const isActive = offset === 0;
                  const imagePath = item.backdrop_path || item.poster_path;

                  return (
                    <Link
                      key={`${item.media_type || item.mediaType || 'movie'}-${item.id}`}
                      to={getMediaLink(item)}
                      className={`hero-carousel-card ${getHeroSlotClass(offset)}`}
                      aria-label={`${isActive ? 'Open featured title' : 'Open queued title'} ${getMovieTitle(item)}`}
                      aria-hidden={!isActive}
                      tabIndex={isActive ? 0 : -1}
                    >
                      {imagePath ? (
                        <img
                          src={getImageUrl(imagePath, !!item.backdrop_path)}
                          alt={getMovieTitle(item)}
                        />
                      ) : (
                        <span>{getMovieTitle(item)}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="sections-container">
        {rows.slice(0, 3).map(renderRow)}
        {rows.slice(3).map(renderRow)}
      </div>
    </div>
  );
}
