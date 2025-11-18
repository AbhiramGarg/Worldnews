import React from 'react';
import { data as rawData } from './data'; 
import { ResponsiveMap } from './components/Map';
import { FeatureCollection } from 'geojson'; 

// Define constants for the design
const NAVBAR_HEIGHT = '60px'; 
const MAP_CONTENT_OCCUPANCY = '100%'; // Map content will fill 100% of the main area's width/height

// Type assertion for data (assuming data.ts was fixed as discussed)
const data = rawData as FeatureCollection;

const Home = () => {
  return (
    // 1. Outer Container: Takes up full viewport height
    <div 
      style={{
        minHeight: '100vh', 
        width: '100vw',
        display: 'flex',
        flexDirection: 'column', // Stack Navbar and Content vertically
      }}
    >
      
      {/* 2. Navbar Placeholder */}
      <nav 
        style={{ 
          height: NAVBAR_HEIGHT, 
          background: '#333', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          paddingLeft: '20px',
          // Optional: Add a shadow to make it look distinct
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
        }}
      >
        World News App Navbar
      </nav>
      
      {/* 3. Main Content Area: Takes up remaining height and centers the map */}
      <main 
        style={{
          // Use calc() to subtract Navbar height from full viewport height
          height: `calc(100vh - ${NAVBAR_HEIGHT})`, 
          width: '100%',
          display: 'flex',
          // Vertical Centering of all content (heading + map)
          justifyContent: 'center', 
          // Horizontal Centering of all content (heading + map)
          alignItems: 'center',    
          flexDirection: 'column', 
          boxSizing: 'border-box',
          overflow: 'hidden', // Prevent scrollbars from popping up due to minor layout issues
        }}
      >
        <h1 style={{ 
          marginBottom: '10px', 
          fontSize: '2em',
          // Ensure heading is centered horizontally too
          textAlign: 'center' 
        }}>Interactive World Map</h1>
        
        {/* 4. Map Wrapper: Constrains the map to occupy 90% of the available space */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            flex: 1,
          }}
        >
          <div
            style={{
              width: MAP_CONTENT_OCCUPANCY,
              height: MAP_CONTENT_OCCUPANCY,
              maxWidth: '2400px',
              maxHeight: '1400px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ResponsiveMap data={data} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;