import { useState, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';

/**
 * Hook for managing advanced search state and API interaction
 */
export const useAdvancedSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  
  // Safe lazy initializer protecting against malformed JSON crashes
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const storedData = localStorage.getItem('recent_searches');
      return storedData ? JSON.parse(storedData) : [];
    } catch (err) {
      console.error('Failed to parse malformed JSON payload from recent_searches storage stream:', err);
      return [];
    }
  });

  const fetchResults = useMemo(
    () =>
      debounce(async (searchQuery, filters) => {
        if (searchQuery.length < 2) {
          setResults([]);
          setSuggestions([]);
          return;
        }

        setLoading(true);
        try {
          // Build query string with facets
          const filterParams = new URLSearchParams({
            q: searchQuery,
            ...filters,
          }).toString();

          const response = await fetch(`/api/search?${filterParams}`);
          const data = await response.json();

          setResults(data.results);
          setFacets(data.facets);
          if (data.suggestions) setSuggestions([data.suggestions]);

          // Update recent searches if results found
          if (data.results.length > 0) {
            updateRecentSearches(searchQuery);
          }
        } catch (error) {
          console.error('Search API Error:', error);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    fetchResults(query, activeFilters);
  }, [query, activeFilters, fetchResults]);

  // Combined tracking tracking mechanism with functional updates and protection
  const updateRecentSearches = (q) => {
    if (!q || q.trim() === '') return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== q);
      const updated = [q, ...filtered].slice(0, 5); // Kept the incoming 5-item clamp limit
      
      try {
        localStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to commit search telemetry update back to local disk storage:', err);
      }
      
      return updated;
    });
  };

  const toggleFilter = (category, value) => {
    setActiveFilters((prev) => {
      const current = prev[category] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return { ...prev, [category]: next };
    });
  };

  const clearFilters = () => setActiveFilters({});

  // Error safety expanded to include saved_searches parser
  const saveSearch = () => {
    let saved = [];
    try {
      const storedSaved = localStorage.getItem('saved_searches');
      saved = storedSaved ? JSON.parse(storedSaved) : [];
    } catch (err) {
      console.error('Failed to parse saved searches payload:', err);
      saved = [];
    }

    const newSave = { query, filters: activeFilters, timestamp: Date.now() };
    const updatedSaved = [...saved, newSave];

    try {
      localStorage.setItem('saved_searches', JSON.stringify(updatedSaved));
    } catch (err) {
      console.error('Failed to save search settings payload profile:', err);
    }
  };

  return {
    query,
    setQuery,
    results,
    loading,
    facets,
    activeFilters,
    toggleFilter,
    clearFilters,
    suggestions,
    recentSearches,
    saveSearch,
  };
};

export default useAdvancedSearch;
