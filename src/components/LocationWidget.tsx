import { useState, useRef, useEffect } from 'react';
import { Compass, Loader2, Book, X, Globe, ChevronDown, Search } from 'lucide-react';
import wikipedia from 'wikipedia';
import type { WikipediaData } from '../types';

interface LocationWidgetProps {
  onLocationSelect: (lat: number, lon: number) => void;
  locationData?: any;
}

const RTL_LANGUAGES = ['fa', 'ar', 'fa-AF', 'fa-IR', 'fa-PK', 'fa-AE', 'fa-SA', 'fa-BH', 'fa-DZ', 'fa-EG', 'fa-IQ', 'fa-JO', 'fa-KW', 'fa-LB', 'fa-LY', 'fa-MA', 'fa-OM', 'fa-QA', 'fa-SA', 'fa-SD', 'fa-SY', 'fa-TN', 'fa-YE'];

const getLanguageName = (langCode: string): string => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode) || langCode;
  } catch (error) {
    return langCode;
  }
};

const isRTL = (langCode: string): boolean => {
  return RTL_LANGUAGES.includes(langCode);
};

export default function LocationWidget({ onLocationSelect, locationData }: LocationWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWikiModal, setShowWikiModal] = useState(false);
  const [wikiData, setWikiData] = useState<WikipediaData | null>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [loadingWiki, setLoadingWiki] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string; name: string }[]>([]);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [persistedLocationData, setPersistedLocationData] = useState<any>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Update persisted location data when locationData changes
  useEffect(() => {
    if (locationData) {
      setPersistedLocationData(locationData);
    }
  }, [locationData]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter languages based on search
  const filteredLanguages = availableLanguages.filter(lang =>
    lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    lang.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSelect(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (error) => {
        setError(
          error.code === 1
            ? 'Location access denied. Please enable location services.'
            : 'Error getting your location. Please try again.'
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleWikiSearch = async () => {
    if (!persistedLocationData) return;
    
    setLoadingWiki(true);
    setError(null);
    
    try {
      const searchTerm = persistedLocationData.address.city || 
                        persistedLocationData.address.town || 
                        persistedLocationData.address.state || 
                        persistedLocationData.address.country;
      
      if (!searchTerm) {
        throw new Error('No valid location name found');
      }

      await wikipedia.setLang(selectedLang);
      
      const searchResults = await wikipedia.search(searchTerm);
      if (!searchResults?.results?.length) {
        throw new Error('No Wikipedia article found for this location');
      }

      const page = await wikipedia.page(searchResults.results[0].title);
      if (!page) {
        throw new Error('Failed to load Wikipedia page');
      }

      const [content, langLinks] = await Promise.all([
        page.summary(),
        page.langLinks().catch(() => [])
      ]);

      if (!content) {
        throw new Error('Failed to load article content');
      }

      setWikiData({
        title: page.title,
        extract: content.extract || 'No content available',
        thumbnail: content.thumbnail?.source,
        url: page.fullurl || `https://${selectedLang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
      });

      const languages = (langLinks || []).map(link => ({
        code: link.lang,
        name: getLanguageName(link.lang)
      }));
      
      setAvailableLanguages(languages);
      setShowWikiModal(true);
    } catch (error) {
      console.error('Wikipedia error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch Wikipedia data');
    } finally {
      setLoadingWiki(false);
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLang(langCode);
    setShowLangDropdown(false);
    setLangSearch('');
    setLoadingWiki(true);
    setError(null);
    
    try {
      await wikipedia.setLang(langCode);
      
      // Use location data to search in the new language
      const searchTerm = persistedLocationData.address.city || 
                        persistedLocationData.address.town || 
                        persistedLocationData.address.state || 
                        persistedLocationData.address.country;
      
      if (!searchTerm) {
        throw new Error('No valid location name found');
      }

      const searchResults = await wikipedia.search(searchTerm);
      if (!searchResults?.results?.length) {
        throw new Error(`No article found in ${getLanguageName(langCode)}`);
      }

      const page = await wikipedia.page(searchResults.results[0].title);
      if (!page) {
        throw new Error('Failed to load Wikipedia page');
      }

      const [content, langLinks] = await Promise.all([
        page.summary(),
        page.langLinks().catch(() => [])
      ]);

      if (!content) {
        throw new Error('Failed to load article content');
      }

      setWikiData({
        title: page.title,
        extract: content.extract || 'No content available',
        thumbnail: content.thumbnail?.source,
        url: page.fullurl || `https://${langCode}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
      });

      // Update available languages
      const languages = (langLinks || []).map(link => ({
        code: link.lang,
        name: getLanguageName(link.lang)
      }));
      
      // Add current language if not in the list
      if (!languages.some(lang => lang.code === langCode)) {
        languages.unshift({
          code: langCode,
          name: getLanguageName(langCode)
        });
      }
      
      setAvailableLanguages(languages);
    } catch (error) {
      console.error('Language change error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content in selected language');
      
      // Keep the previous content if error occurs
      setSelectedLang(selectedLang);
    } finally {
      setLoadingWiki(false);
    }
  };

  const closeModal = () => {
    setShowWikiModal(false);
    setShowLangDropdown(false);
    setLangSearch('');
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 sm:fixed sm:bottom-auto sm:right-4 sm:top-4 sm:left-auto 
                    z-[1000] p-4 sm:p-0 flex flex-col gap-3 
                    bg-gradient-to-t from-white/95 to-white/75 sm:bg-none
                    backdrop-blur-md sm:backdrop-blur-none
                    border-t border-gray-100 sm:border-none">
        <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto">
          <button
            onClick={handleGetLocation}
            disabled={loading}
            className="flex-1 sm:flex-initial
                     bg-white sm:bg-white/90
                     hover:bg-gray-50 sm:hover:bg-white/95
                     text-gray-800
                     font-medium py-3 sm:py-2.5 px-4 
                     rounded-xl sm:rounded-lg 
                     shadow-lg 
                     flex items-center justify-center sm:justify-start gap-2.5 
                     border border-gray-200
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     group
                     min-w-[140px]"
          >
            <div className="p-1.5 sm:p-1 rounded-full bg-blue-50
                          group-hover:bg-blue-100
                          transition-colors">
              {loading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <Compass className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <span>
              {loading ? 'Getting location...' : 'My Location'}
            </span>
          </button>

          {persistedLocationData && (
            <button
              onClick={handleWikiSearch}
              disabled={loadingWiki}
              className="flex-1 sm:flex-initial
                       bg-white sm:bg-white/90
                       hover:bg-gray-50 sm:hover:bg-white/95
                       text-gray-800
                       font-medium py-3 sm:py-2.5 px-4 
                       rounded-xl sm:rounded-lg 
                       shadow-lg 
                       flex items-center justify-center sm:justify-start gap-2.5 
                       border border-gray-200
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       group
                       min-w-[140px]"
            >
              <div className="p-1.5 sm:p-1 rounded-full bg-purple-50
                            group-hover:bg-purple-100
                            transition-colors">
                {loadingWiki ? (
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                ) : (
                  <Book className="w-5 h-5 text-purple-500" />
                )}
              </div>
              <span>
                {loadingWiki ? 'Loading...' : 'Wikipedia'}
              </span>
            </button>
          )}
        </div>
        
        {error && (
          <div className="animate-fade-in
                        bg-red-100/90 backdrop-blur-sm
                        border border-red-200
                        text-red-700
                        px-4 py-3 
                        rounded-xl sm:rounded-lg 
                        text-sm
                        text-center sm:text-left
                        shadow-lg">
            {error}
          </div>
        )}
      </div>

      {/* Wikipedia Modal */}
      {showWikiModal && wikiData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[1001] 
                      flex items-end sm:items-center justify-center 
                      p-0 sm:p-4 md:p-6"
             onClick={closeModal}>
          <div className="bg-white w-full sm:w-auto sm:max-w-2xl 
                       h-[85vh] sm:h-auto sm:max-h-[80vh] 
                       rounded-t-2xl sm:rounded-xl
                       shadow-2xl 
                       overflow-hidden animate-slide-up"
               onClick={e => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className={`pr-8 ${isRTL(selectedLang) ? 'rtl' : 'ltr'}`}>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{wikiData.title}</h2>
                    {availableLanguages.length > 0 && (
                      <div className="relative mt-2" ref={langDropdownRef}>
                        <button
                          onClick={() => setShowLangDropdown(!showLangDropdown)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900
                                   px-3 py-1.5 rounded-lg border border-gray-200 
                                   hover:bg-gray-50 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          {getLanguageName(selectedLang)}
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {showLangDropdown && (
                          <div className="absolute top-full mt-1 left-0 right-0 md:w-64 bg-white rounded-lg 
                                        shadow-lg border border-gray-200 z-10">
                            <div className="p-2 border-b border-gray-200">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={langSearch}
                                  onChange={(e) => setLangSearch(e.target.value)}
                                  placeholder="Search language..."
                                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200
                                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto overscroll-contain py-1">
                              {filteredLanguages.map((lang) => (
                                <button
                                  key={lang.code}
                                  onClick={() => handleLanguageChange(lang.code)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 
                                           hover:bg-gray-50 flex items-center gap-2"
                                >
                                  {lang.name}
                                  <span className="text-xs text-gray-400 ml-1">({lang.code})</span>
                                  {lang.code === selectedLang && (
                                    <span className="ml-auto text-blue-500">✓</span>
                                  )}
                                </button>
                              ))}
                              {filteredLanguages.length === 0 && (
                                <div className="px-4 py-2 text-sm text-gray-500">
                                  No languages found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 
                            ${isRTL(selectedLang) ? 'rtl text-right' : 'ltr text-left'}`}>
                {wikiData.thumbnail && (
                  <img
                    src={wikiData.thumbnail}
                    alt={wikiData.title}
                    className={`${isRTL(selectedLang) ? 'float-left ml-0 mr-4' : 'float-right ml-4 mr-0'} 
                             mb-4 rounded-lg shadow-md 
                             w-32 sm:w-48 md:w-64 max-w-[200px]`}
                  />
                )}
                <p className={`text-gray-600 leading-relaxed ${isRTL(selectedLang) ? 'font-sans' : ''}`}>
                  {loadingWiki ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    wikiData.extract
                  )}
                </p>
              </div>

              {/* Footer */}
              <div className={`flex-shrink-0 p-4 md:p-6 border-t border-gray-200
                            ${isRTL(selectedLang) ? 'rtl' : 'ltr'}`}>
                <a
                  href={wikiData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <span>{isRTL(selectedLang) ? 'مطالعه بیشتر در ویکی‌پدیا' : 'Read more on Wikipedia'}</span>
                  <svg className={`w-4 h-4 ${isRTL(selectedLang) ? 'rotate-180' : ''}`} 
                       fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}