'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ArticleCard from '../components/ArticleCard';

interface Article {
  apiId: string;
  title: string;
  summary?: string | null;
  text: string;
  image?: string | null;
  url?: string | null;
  publishDate: Date | string;
}

// Data Definitions
const CATEGORIES = ['All', 'Business', 'Entertainment', 'Politics', 'Sports', 'Technology'];
const COUNTRIES = [
  { code: 'All', name: 'All Countries' },
  { code: 'US', name: 'United States of America' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'RU', name: 'Russia' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'IL', name: 'Israel' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SE', name: 'Sweden' },
  { code: 'IE', name: 'Ireland' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'PL', name: 'Poland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'RO', name: 'Romania' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CL', name: 'Chile' },
  { code: 'GR', name: 'Greece' },
  { code: 'DK', name: 'Denmark' },
  { code: 'IR', name: 'Iran' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
];

// ISO2 codes for the interactive map countries (kept in sync with Map component)
const INTERACTIVE_ISO2 = [
  'US','CA','MX','BR','AR','GB','FR','DE','IT','ES','RU','CN','IN','JP','KR','AU','ZA','EG','TR','SA','IR','IL','UA','PK','ID','TH','VN','PH','NG','ET','KE','CO','PE','CL','SE','NO','FI','PL','NL','BE','CH','AT','CZ','HU','GR','PT','RO','RS','DK','IE',
];

// Build a combined country list: base COUNTRIES plus any interactive ISO2 codes not present.
const ALL_COUNTRIES: { code: string; name: string }[] = (() => {
  const existingCodes = new Set(COUNTRIES.map(c => c.code.toUpperCase()));
  const extras: { code: string; name: string }[] = [];

  for (const iso of INTERACTIVE_ISO2) {
    const up = iso.toUpperCase();
    if (existingCodes.has(up)) continue;
    let name = up;
    try {
      if (typeof Intl !== 'undefined' && (Intl as any).DisplayNames) {
        const dn = new (Intl as any).DisplayNames(['en'], { type: 'region' });
        const resolved = dn.of(up);
        if (resolved) name = resolved;
      }
    } catch (e) {
      // swallow
    }
    extras.push({ code: up, name });
  }

  return [...COUNTRIES, ...extras];
})();

const Home = () => {
  // State for selections and search inputs
  const [selectedCountry, setSelectedCountry] = useState(ALL_COUNTRIES[0]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [countrySearch, setCountrySearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [urlInitialized, setUrlInitialized] = useState(false);
  
  // --- NEW STATES for Keyboard Navigation ---
  const [focusedCountryIndex, setFocusedCountryIndex] = useState(-1);
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(-1);

  // Refs for inputs (optional, but clean)
  const countryInputRef = useRef(null);
  const categoryInputRef = useRef(null);

  // On mount: read URL search params and initialize selected values
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const countryParam = params.get('country');

      if (countryParam) {
        const codeUpper = countryParam.toUpperCase();
        // Try to find by code first
        let found = COUNTRIES.find(c => c.code.toUpperCase() === codeUpper);
        // Fallback: try matching by full country name (user may pass full name)
        if (!found) {
          found = COUNTRIES.find(c => c.name.toUpperCase() === countryParam.toUpperCase());
        }
        // Fallback: try Intl.DisplayNames to resolve ISO2 -> country name (covers many missing entries)
        if (!found) {
          try {
            if (typeof Intl !== 'undefined' && (Intl as any).DisplayNames) {
              const dn = new (Intl as any).DisplayNames(['en'], { type: 'region' });
              const resolved = dn.of(codeUpper);
              if (resolved) {
                found = { code: codeUpper, name: resolved };
              }
            }
          } catch (e) {
            // ignore Intl failures
          }
        }
        // Final fallback: show the code if nothing else found
        if (found) {
          setSelectedCountry(found);
        } else {
          setSelectedCountry({ code: codeUpper, name: codeUpper });
        }
      }

      const categoryParam = params.get('category');
      if (categoryParam) {
        const normalized = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1).toLowerCase();
        if (CATEGORIES.includes(normalized)) setSelectedCategory(normalized);
      }
    } catch (e) {
      // ignore malformed URL or access errors
    }
    // Set flag to indicate URL params have been read
    setUrlInitialized(true);
  }, []);


  // --- Filtering Logic for Country Dropdown ---
  const filteredCountries = useMemo(() => {
    // Reset focus when search changes
    setFocusedCountryIndex(-1); 
    if (!countrySearch) return ALL_COUNTRIES;
    const searchLower = countrySearch.toLowerCase();

    return ALL_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase() === searchLower
    );
  }, [countrySearch]);

  // --- Filtering Logic for Category Dropdown ---
  const filteredCategories = useMemo(() => {
    // Reset focus when search changes
    setFocusedCategoryIndex(-1);
    if (!categorySearch) return CATEGORIES;
    const searchLower = categorySearch.toLowerCase();
    return CATEGORIES.filter((category) =>
      category.toLowerCase().includes(searchLower)
    );
  }, [categorySearch]);

  // --- Handler for selecting a country ---
  const handleCountrySelect = (country: { code: string; name: string }) => {
    setSelectedCountry(country);
    setCountrySearch('');
    setFocusedCountryIndex(-1); // Reset focus
  };

  // --- Handler for selecting a category ---
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCategorySearch('');
    setFocusedCategoryIndex(-1); // Reset focus
  };


  // --- Keydown Handler for Country Dropdown ---
  const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const listLength = filteredCountries.length;
    if (listLength === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); 
        setFocusedCountryIndex(prevIndex => (prevIndex < listLength - 1 ? prevIndex + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault(); 
        setFocusedCountryIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : listLength - 1));
        break;

      case 'Enter':
        if (focusedCountryIndex >= 0) {
          e.preventDefault(); 
          handleCountrySelect(filteredCountries[focusedCountryIndex]);
        }
        break;
      
      default:
        // Reset focus on any other input to allow text filtering
        setFocusedCountryIndex(-1);
        break;
    }
  };

  // --- Keydown Handler for Category Dropdown ---
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const listLength = filteredCategories.length;
    if (listLength === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedCategoryIndex(prevIndex => (prevIndex < listLength - 1 ? prevIndex + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedCategoryIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : listLength - 1));
        break;

      case 'Enter':
        if (focusedCategoryIndex >= 0) {
          e.preventDefault();
          handleCategorySelect(filteredCategories[focusedCategoryIndex]);
        }
        break;
      
      default:
        // Reset focus on any other input
        setFocusedCategoryIndex(-1);
        break;
    }
  };

  // --- Logic to determine the display text in the P tag ---
  const displayText = useMemo(() => {
    const isAllCountry = selectedCountry.code === 'All';
    const isAllCategory = selectedCategory === 'All';

    if (isAllCountry && isAllCategory) {
      return 'World News';
    } else if (isAllCategory) {
      return `${selectedCountry.name} News`;
    } else if (isAllCountry) {
      return `${selectedCategory} News`;
    } else {
      return `${selectedCountry.name} - ${selectedCategory} News`;
    }
  }, [selectedCountry, selectedCategory]);

  const viewingDetails = useMemo(() => {
    const details: string[] = [];
    details.push(`Country: ${selectedCountry.name}`);
    if (selectedCategory !== 'All') {
      details.push(`Category: ${selectedCategory}`);
    }
    return details.join(' • ');
  }, [selectedCountry, selectedCategory]);

  // --- Logic to update the URL in the browser history ---
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCountry.code !== 'All') {
      params.append('country', selectedCountry.code.toLowerCase());
    }
    if (selectedCategory !== 'All') {
      params.append('category', selectedCategory.toLowerCase());
    }

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);

  }, [selectedCountry, selectedCategory]);

  // --- Fetch titles from backend when filters change ---
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [expandedArticleId, setExpandedArticleId] = React.useState<string | null>(null);
  
  useEffect(() => {
    // Only fetch after URL params have been read
    if (!urlInitialized) return;

    const fetchArticles = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCountry && selectedCountry.code && selectedCountry.code !== 'All') {
          params.append('country', selectedCountry.code.toLowerCase());
        }
        if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory.toLowerCase());
        }
        const q = params.toString();
        const res = await fetch(`/api/articles${q ? `?${q}` : ''}`);
        if (!res.ok) {
          setArticles([]);
          return;
        }
        const data = await res.json();
        setArticles(Array.isArray(data.articles) ? data.articles : []);
        // Reset expanded article when filters change
        setExpandedArticleId(null);
      } catch (e) {
        setArticles([]);
      }
    };

    fetchArticles();
  }, [selectedCountry, selectedCategory, urlInitialized]);


  // --- Rendered Component Structure ---
  return (
    <div style={styles.container} data-container>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>📰 Filter News Feed</h2>
        <p style={styles.pageSubtitle}>Discover relevant stories by country and category in real time.</p>
      </div>

      <div style={styles.mainLayout as React.CSSProperties} data-layout-grid>
        {/* --- Filters Sidebar --- */}
        <div style={styles.filtersSidebar} data-sticky-sidebar>
          <div style={styles.filtersContainer as React.CSSProperties} data-filters>
            <h4 style={styles.filterHeading}>Filters</h4>
            
            {/* --- 1. Country Dropdown with Search and Keyboard Nav --- */}
            <div style={styles.dropdown as React.CSSProperties}>
              <label style={styles.inputLabel}>Select Country</label>
              <input
                ref={countryInputRef}
                type="text"
                placeholder={selectedCountry.name}
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                onKeyDown={handleCountryKeyDown} // Keydown Handler
                style={styles.searchInput}
                data-filter-input
              />
              {countrySearch && (
                <div style={styles.suggestionsBox as React.CSSProperties}>
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country, index) => (
                      <div
                        key={country.code}
                        onClick={() => handleCountrySelect(country)}
                        // Conditional style for keyboard focus
                        style={{ 
                          ...styles.suggestionItem,
                          ...(index === focusedCountryIndex ? styles.focusedItem : {})
                        }}
                        data-suggestion-item
                      >
                        {country.name} ({country.code})
                      </div>
                    ))
                  ) : (
                    <div style={styles.noResults}>No matching countries found.</div>
                  )}
                </div>
              )}
            </div>

            {/* --- 2. Category Dropdown with Search and Keyboard Nav --- */}
            <div style={styles.dropdown as React.CSSProperties}>
              <label style={styles.inputLabel}>Select Category</label>
              <input
                ref={categoryInputRef}
                type="text"
                placeholder={selectedCategory}
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                onKeyDown={handleCategoryKeyDown} // Keydown Handler
                style={styles.searchInput}
                data-filter-input
              />
              {categorySearch && (
                <div style={styles.suggestionsBox as React.CSSProperties}>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category, index) => (
                      <div
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        // Conditional style for keyboard focus
                        style={{ 
                          ...styles.suggestionItem,
                          ...(index === focusedCategoryIndex ? styles.focusedItem : {})
                        }}
                        data-suggestion-item
                      >
                        {category}
                      </div>
                    ))
                  ) : (
                    <div style={styles.noResults}>No matching categories found.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --- Display Info --- */}
          <div style={styles.displayArea}>
            <p style={styles.displayLabel}>Currently Viewing</p>
            <p style={styles.displayTextP}>{displayText}</p>
            <p style={styles.urlDisplay}>
              <span style={styles.urlValue}>
                {viewingDetails}
              </span>
            </p>
          </div>
        </div>

        {/* --- Articles Section --- */}
        <div style={styles.articlesSection as React.CSSProperties} data-article-section>
          <h3 style={styles.articleHeading}>Articles ({articles.length})</h3>
          {articles.length > 0 ? (
            <div style={styles.articlesGrid}>
              {articles.map((article) => (
                <ArticleCard
                  key={article.apiId}
                  article={article}
                  isExpanded={expandedArticleId === article.apiId}
                  onToggle={(articleId) => {
                    // If clicking the same article, close it; otherwise open the new one
                    setExpandedArticleId(
                      expandedArticleId === articleId ? null : articleId
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <p style={styles.noArticles}>No articles found for these filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

// --- Basic Inline Styles for clarity and structure ---
const styles = {
  container: {
    padding: '22px',
    fontFamily: 'Arial, sans-serif',
    background: 'var(--page-bg)',
    minHeight: '100vh',
    width: '100%',
  },

  pageHeader: {
    marginBottom: '16px',
  },

  pageTitle: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: '1.9rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },

  pageSubtitle: {
    margin: '8px 0 0 0',
    color: 'var(--text-secondary)',
    fontSize: '0.98rem',
    lineHeight: 1.45,
  },

  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '300px minmax(0, 1fr)',
    gap: '24px',
    marginTop: '20px',
  } as React.CSSProperties & { '@media (max-width: 1024px)': any },

  filtersSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'sticky',
    top: '16px',
    height: 'fit-content',
  } as React.CSSProperties,

  filtersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '18px 18px 16px',
    backgroundColor: 'var(--panel-bg)',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 8px 28px var(--shadow-color)',
  },

  filterHeading: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },

  inputLabel: {
    color: 'var(--text-secondary)',
    fontWeight: 700,
    fontSize: '0.9rem',
  },

  dropdown: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },

  searchInput: {
    padding: '11px 12px',
    marginTop: '6px',
    border: '1px solid var(--input-border)',
    borderRadius: '10px',
    fontSize: '0.95em',
    fontFamily: 'inherit',
    color: 'var(--input-text)',
    backgroundColor: 'var(--input-bg)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
  },

  suggestionsBox: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    border: '1px solid var(--input-border)',
    borderTop: 'none',
    maxHeight: '230px',
    overflowY: 'auto',
    backgroundColor: 'var(--dropdown-bg)',
    zIndex: 20,
    boxShadow: '0 14px 30px var(--shadow-color)',
    marginTop: '-1px',
    borderRadius: '0 0 10px 10px',
  },

  suggestionItem: {
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.9em',
    color: 'var(--text-primary)',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },

  focusedItem: {
    backgroundColor: 'var(--accent-strong)',
    color: 'white',
  },

  noResults: {
    padding: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontSize: '0.9em',
  } as React.CSSProperties,

  displayArea: {
    padding: '16px',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    background: 'var(--panel-grad)',
    boxShadow: '0 8px 24px var(--shadow-color)',
  },

  displayLabel: {
    margin: 0,
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  } as React.CSSProperties,

  displayTextP: {
    fontSize: '1.16em',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '8px 0 2px',
  },

  urlDisplay: {
    marginTop: '8px',
    fontSize: '0.8em',
    color: 'var(--text-muted)',
  },

  urlValue: {
    fontWeight: '600',
    color: 'var(--accent-text)',
    wordBreak: 'break-word',
  } as React.CSSProperties,

  articlesSection: {
    backgroundColor: 'var(--panel-bg)',
    padding: '24px',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 8px 28px var(--shadow-color)',
  } as React.CSSProperties,

  articleHeading: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '-0.015em',
  },

  articlesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    marginTop: '20px',
    width: '100%',
  } as React.CSSProperties,

  noArticles: {
    color: 'var(--text-muted)',
    fontSize: '1em',
    textAlign: 'center',
    padding: '40px 20px',
  } as React.CSSProperties,
};