'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react';

// Data Definitions
const TOPICS = ['All', 'Business', 'Politics', 'Sports', 'Fashion', 'Nature'];
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

const Home = () => {
  // State for selections and search inputs
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [countrySearch, setCountrySearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [currentUrlSearch, setCurrentUrlSearch] = useState(''); 
  
  // --- NEW STATES for Keyboard Navigation ---
  const [focusedCountryIndex, setFocusedCountryIndex] = useState(-1);
  const [focusedTopicIndex, setFocusedTopicIndex] = useState(-1);

  // Refs for inputs (optional, but clean)
  const countryInputRef = useRef(null);
  const topicInputRef = useRef(null);


  // --- Filtering Logic for Country Dropdown ---
  const filteredCountries = useMemo(() => {
    // Reset focus when search changes
    setFocusedCountryIndex(-1); 
    if (!countrySearch) return COUNTRIES;
    const searchLower = countrySearch.toLowerCase();

    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(searchLower) ||
        country.code.toLowerCase() === searchLower
    );
  }, [countrySearch]);

  // --- Filtering Logic for Topic Dropdown ---
  const filteredTopics = useMemo(() => {
    // Reset focus when search changes
    setFocusedTopicIndex(-1);
    if (!topicSearch) return TOPICS;
    const searchLower = topicSearch.toLowerCase();
    return TOPICS.filter((topic) =>
      topic.toLowerCase().includes(searchLower)
    );
  }, [topicSearch]);

  // --- Handler for selecting a country ---
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setCountrySearch('');
    setFocusedCountryIndex(-1); // Reset focus
  };

  // --- Handler for selecting a topic ---
  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setTopicSearch('');
    setFocusedTopicIndex(-1); // Reset focus
  };


  // --- Keydown Handler for Country Dropdown ---
  const handleCountryKeyDown = (e) => {
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

  // --- Keydown Handler for Topic Dropdown ---
  const handleTopicKeyDown = (e) => {
    const listLength = filteredTopics.length;
    if (listLength === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedTopicIndex(prevIndex => (prevIndex < listLength - 1 ? prevIndex + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedTopicIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : listLength - 1));
        break;

      case 'Enter':
        if (focusedTopicIndex >= 0) {
          e.preventDefault();
          handleTopicSelect(filteredTopics[focusedTopicIndex]);
        }
        break;
      
      default:
        // Reset focus on any other input
        setFocusedTopicIndex(-1);
        break;
    }
  };

  // --- Logic to determine the display text in the P tag (remains the same) ---
  const displayText = useMemo(() => {
    const isAllCountry = selectedCountry.code === 'All';
    const isAllTopic = selectedTopic === 'All';

    if (isAllCountry && isAllTopic) {
      return 'World News';
    } else if (isAllTopic) {
      return `${selectedCountry.name} News`;
    } else if (isAllCountry) {
      return `${selectedTopic} News`;
    } else {
      return `${selectedCountry.name} - ${selectedTopic} News`;
    }
  }, [selectedCountry, selectedTopic]);

  // --- Logic to update the URL in the browser history (remains the same) ---
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCountry.code !== 'All') {
      params.append('country', selectedCountry.code.toLowerCase());
    }
    if (selectedTopic !== 'All') {
      params.append('topic', selectedTopic.toLowerCase());
    }

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
    setCurrentUrlSearch(window.location.search || 'No filters selected'); 

  }, [selectedCountry, selectedTopic]);


  // --- Rendered Component Structure ---
  return (
    <div style={styles.container}>
      <h2>📰 Filter News Feed </h2>

      <div style={styles.filtersContainer}>
        
        {/* --- 1. Country Dropdown with Search and Keyboard Nav --- */}
        <div style={styles.dropdown}>
          <label>Select Country:</label>
          <input
            ref={countryInputRef}
            type="text"
            placeholder={selectedCountry.name}
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            onKeyDown={handleCountryKeyDown} // Keydown Handler
            style={styles.searchInput}
          />
          {countrySearch && (
            <div style={styles.suggestionsBox}>
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

        {/* --- 2. Topic Dropdown with Search and Keyboard Nav --- */}
        <div style={styles.dropdown}>
          <label>Select Topic:</label>
          <input
            ref={topicInputRef}
            type="text"
            placeholder={selectedTopic}
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            onKeyDown={handleTopicKeyDown} // Keydown Handler
            style={styles.searchInput}
          />
          {topicSearch && (
            <div style={styles.suggestionsBox}>
              {filteredTopics.length > 0 ? (
                filteredTopics.map((topic, index) => (
                  <div
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    // Conditional style for keyboard focus
                    style={{ 
                      ...styles.suggestionItem,
                      ...(index === focusedTopicIndex ? styles.focusedItem : {})
                    }}
                  >
                    {topic}
                  </div>
                ))
              ) : (
                <div style={styles.noResults}>No matching topics found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <hr style={styles.hr} />

      {/* --- Display P Tag and Generated URL --- */}
      <div style={styles.displayArea}>
        <h3>Currently Viewing:</h3>
        <p style={styles.displayTextP}>{displayText}</p>
        <p style={styles.urlDisplay}>
            **Generated URL Segment:** <span style={styles.urlValue}>
                {currentUrlSearch}
            </span>
        </p>
      </div>
    </div>
  );
};

export default Home;

// --- Basic Inline Styles for clarity and structure ---
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  filtersContainer: {
    display: 'flex',
    gap: '40px',
    marginBottom: '30px',
  },
  dropdown: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '300px',
  },
  searchInput: {
    padding: '8px',
    marginTop: '5px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  suggestionsBox: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    border: '1px solid #ccc',
    borderTop: 'none',
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white',
    zIndex: 10,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  suggestionItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
  },
  focusedItem: { // Style for the keyboard-navigated item
    backgroundColor: '#007bff',
    color: 'white',
  },
  noResults: {
    padding: '10px',
    color: '#999',
  },
  hr: {
    margin: '30px 0',
    borderColor: '#eee',
  },
  displayArea: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#f9f9f9',
  },
  displayTextP: {
    fontSize: '1.5em',
    fontWeight: 'bold',
    color: '#333',
    margin: '10px 0',
  },
  urlDisplay: {
    marginTop: '15px',
    fontSize: '0.9em',
    color: '#555',
  },
  urlValue: {
    fontWeight: 'bold',
    color: '#007bff',
  }
};