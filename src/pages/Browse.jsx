import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import {
  fetchDiscoverMovies,
  fetchDiscoverTV,
  fetchKDramas,
  fetchPopular,
  fetchTopRated,
  fetchTrendingMovies,
  fetchTrendingTV
} from '../api';
import { getBrowseRowConfig } from '../homeRows';
import { getResumeItems, mapResumeItemsForCards } from '../localResume';
import MovieCard from '../components/MovieCard';
import './Browse.css';

const mergeUniqueMediaItems = (groups) => {
  const seen = new Set();

  return groups.flat().filter((item) => {
    if (!item?.id) return false;
    const type = item.media_type || item.mediaType || (item.name ? 'tv' : 'movie');
    const key = `${type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return item.poster_path || item.backdrop_path || item.title || item.name;
  });
};

const fetchBrowseItems = async (config) => {
  if (!config) return [];

  if (config.source === 'resume') {
    return mapResumeItemsForCards(getResumeItems());
  }

  if (config.source === 'moviesHub') {
    const [trending, action, horror, comedy, family, topRated] = await Promise.all([
      fetchTrendingMovies(),
      fetchDiscoverMovies({ withGenres: '28,12', sortBy: 'popularity.desc' }),
      fetchDiscoverMovies({ withGenres: '27,53', sortBy: 'popularity.desc' }),
      fetchDiscoverMovies({ withGenres: '35', sortBy: 'popularity.desc' }),
      fetchDiscoverMovies({ withGenres: '10751,16', sortBy: 'popularity.desc' }),
      fetchTopRated()
    ]);

    return mergeUniqueMediaItems([
      trending.results || [],
      action.results || [],
      horror.results || [],
      comedy.results || [],
      family.results || [],
      topRated.results || []
    ]).slice(0, 72);
  }

  if (config.source === 'tvHub') {
    const [trending, kDramas, drama, comedy] = await Promise.all([
      fetchTrendingTV(),
      fetchKDramas(),
      fetchDiscoverTV({ withGenres: '18', sortBy: 'popularity.desc' }),
      fetchDiscoverTV({ withGenres: '35', sortBy: 'popularity.desc' })
    ]);

    return mergeUniqueMediaItems([
      trending.results || [],
      kDramas.results || [],
      drama.results || [],
      comedy.results || []
    ]).slice(0, 72);
  }

  if (config.source === 'popular') {
    const data = await fetchPopular();
    return data.results || [];
  }

  if (config.source === 'trendingMovies') {
    const data = await fetchTrendingMovies();
    return data.results || [];
  }

  if (config.source === 'trendingShows') {
    const data = await fetchTrendingTV();
    return data.results || [];
  }

  if (config.source === 'kDramas') {
    const data = await fetchKDramas();
    return data.results || [];
  }

  if (config.source === 'topRated') {
    const data = await fetchTopRated();
    return data.results || [];
  }

  if (config.source === 'discover') {
    const data = await fetchDiscoverMovies({
      withGenres: config.withGenres,
      sortBy: config.sortBy
    });
    return data.results || [];
  }

  if (config.source === 'discoverTV') {
    const data = await fetchDiscoverTV({
      withGenres: config.withGenres,
      sortBy: config.sortBy
    });
    return data.results || [];
  }

  return [];
};

export default function Browse() {
  const { rowId } = useParams();
  const config = getBrowseRowConfig(rowId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadBrowseItems = async () => {
      setLoading(true);
      setError('');

      try {
        const nextItems = await fetchBrowseItems(config);
        setItems(nextItems);
        setError(nextItems.length > 0 ? '' : 'Nothing loaded for this shelf yet.');
      } catch (loadError) {
        console.error('Failed to load browse shelf', loadError);
        setItems([]);
        setError('This shelf could not load. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBrowseItems();
    window.scrollTo(0, 0);
  }, [config, reloadKey]);

  if (!config) {
    return (
      <div className="browse-page container">
        <Link to="/" className="browse-back"><ChevronLeft size={18} /> Home</Link>
        <h1>Shelf not found</h1>
        <p className="browse-note">That Explore shelf does not exist.</p>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <section className="browse-header container">
        <Link to="/" className="browse-back"><ChevronLeft size={18} /> Home</Link>
        <p className="browse-kicker">{config.note || 'KBY MAX'}</p>
        <h1>{config.title}</h1>
        {config.quickLinks?.length > 0 && (
          <div className="browse-quick-links" aria-label={`${config.title} categories`}>
            {config.quickLinks.map((link) => (
              <Link key={link.id} to={`/browse/${link.id}`} className="browse-chip">
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="loading-screen browse-loading"><div className="loader"></div></div>
      ) : items.length > 0 ? (
        <section className="container browse-grid movie-grid animate-fade-in">
          {items.map((movie, index) => (
            <div className={config.type === 'ranked' ? 'browse-rank-item' : ''} key={`${movie.media_type || 'movie'}-${movie.id}`}>
              {config.type === 'ranked' && <span className="browse-rank">{index + 1}</span>}
              <MovieCard movie={movie} />
            </div>
          ))}
        </section>
      ) : (
        <section className="browse-empty container">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw size={18} /> Retry
          </button>
        </section>
      )}
    </div>
  );
}
