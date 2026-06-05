import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMoviesWithFallback } from '../searchCatalog';
import MovieCard from '../components/MovieCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setUsedFallback(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchMoviesWithFallback(query);
        setResults(data.results || []);
        setUsedFallback(!!data.usedFallback);
      } catch (error) {
        console.error("Search failed", error);
        setResults([]);
        setUsedFallback(false);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
      <h2 style={{ marginBottom: '2rem' }}>
        Search Results for "{query}"
      </h2>
      {usedFallback && (
        <p style={{ marginTop: '-1.25rem', marginBottom: '2rem', color: '#17c3d1', fontWeight: 800 }}>
          Showing close matches from KBY MAX.
        </p>
      )}
      
      {loading ? (
        <div className="loading-screen" style={{ height: '50vh' }}><div className="loader"></div></div>
      ) : results.length > 0 ? (
        <div className="movie-grid animate-fade-in">
          {results.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <p>No results found for "{query}". Try a shorter title or simpler spelling.</p>
      )}
    </div>
  );
}
