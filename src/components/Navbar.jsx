import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { getImageUrl } from '../api';
import { searchMoviesWithFallback } from '../searchCatalog';
import { getMediaLink, getMovieTitle } from '../movieLinks';
import BrandLogo from './BrandLogo';
import { NAV_LINKS } from '../navLinks';
import './Navbar.css';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with a slight debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const data = await searchMoviesWithFallback(query);
        setSuggestions(data.results?.slice(0, 5) || []);
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      }
    };

    const timerId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timerId);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsMobileMenuOpen(false);
      setShowSuggestions(false);
      setQuery('');
    }
  };

  const handleSuggestionClick = (movie) => {
    navigate(getMediaLink(movie));
    setShowSuggestions(false);
    setQuery('');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container flex items-center justify-between">
        <div className="nav-left flex items-center gap-8">
          <Link to="/" className="brand" aria-label="KBY MAX home">
            <BrandLogo />
          </Link>

          <div className="nav-links hidden-mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="nav-right flex items-center gap-4">
          <div className="search-container hidden-mobile" ref={searchRef}>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Titles, people, genres"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="search-input"
              />
              <Search size={20} className="search-icon" />
            </form>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map(movie => (
                  <div
                    key={`${movie.media_type || movie.mediaType || 'movie'}-${movie.id}`}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(movie)}
                  >
                    {movie.poster_path ? (
                      <img
                        src={getImageUrl(movie.poster_path)}
                        alt={getMovieTitle(movie)}
                        className="suggestion-img"
                      />
                    ) : (
                      <div className="suggestion-img suggestion-img-placeholder" aria-hidden="true">
                        {getMovieTitle(movie).slice(0, 1)}
                      </div>
                    )}
                    <div className="suggestion-info">
                      <h4 className="suggestion-title">{getMovieTitle(movie)}</h4>
                      <div className="suggestion-meta">
                        <span className="suggestion-year">
                          {(movie.release_date || movie.first_air_date)?.substring(0, 4) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn-icon mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <div className="search-container">
            <form onSubmit={handleSearch} className="mobile-search">
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input full-width"
              />
            </form>
            {query.length >= 2 && suggestions.length > 0 && (
              <div className="mobile-suggestions">
                {suggestions.map(movie => (
                  <div
                    key={`${movie.media_type || movie.mediaType || 'movie'}-${movie.id}`}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(movie)}
                  >
                    {movie.poster_path ? (
                      <img
                        src={getImageUrl(movie.poster_path)}
                        alt={getMovieTitle(movie)}
                        className="suggestion-img"
                      />
                    ) : (
                      <div className="suggestion-img suggestion-img-placeholder" aria-hidden="true">
                        {getMovieTitle(movie).slice(0, 1)}
                      </div>
                    )}
                    <div className="suggestion-info">
                      <h4 className="suggestion-title">{getMovieTitle(movie)}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
