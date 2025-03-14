import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import axios from 'axios';
import type { SearchResult } from '../types';

interface SearchBarProps {
  onSelectLocation: (lat: number, lon: number) => void;
}

export default function SearchBar({ onSelectLocation }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRealTimeSearch, setIsRealTimeSearch] = useState(true);
  const debounceTimer = useRef<number>();

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRealTimeSearch) return;
    
    if (query.length < 3) {
      setResults([]);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [query, isRealTimeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 3) {
      performSearch(query);
    }
  };

  const handleSearchModeToggle = () => {
    setIsRealTimeSearch(!isRealTimeSearch);
    setResults([]); // Clear results when switching modes
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[90vw] max-w-md transition-all duration-200">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search locations..."
              className="w-full px-4 py-3 pr-10 rounded-lg 
                     bg-white/90 backdrop-blur-sm
                     border border-gray-200
                     text-gray-900
                     placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     shadow-lg transition-all duration-200"
            />
            <div className="absolute right-3 top-3">
              {loading ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <Search className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>
          
          {!isRealTimeSearch && (
            <button
              type="submit"
              className="px-4 py-3 rounded-lg 
                       bg-blue-500 hover:bg-blue-600
                       text-white font-medium
                       shadow-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={query.length < 3 || loading}
            >
              Search
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearchModeToggle}
          className="absolute -bottom-8 left-0 text-sm text-gray-600 hover:text-gray-900"
        >
          {isRealTimeSearch ? "Switch to manual search" : "Switch to real-time search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-lg 
                      bg-white/90 backdrop-blur-sm
                      border border-gray-200 shadow-lg
                      divide-y divide-gray-200
                      animate-fade-in">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => {
                onSelectLocation(parseFloat(result.lat), parseFloat(result.lon));
                setResults([]);
                setQuery('');
              }}
              className="w-full px-4 py-3 text-left 
                       hover:bg-gray-50/80
                       flex items-center gap-3 transition-colors"
            >
              <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {result.display_name.split(',')[0]}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {result.display_name.split(',').slice(1).join(',')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}