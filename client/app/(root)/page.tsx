import React from 'react';
import { data as rawData } from './data'; 
import { ResponsiveMap } from './components/Map';
import { FeatureCollection } from 'geojson'; 

// Define constants for the design
const MAP_CONTENT_OCCUPANCY = '100%'; // Map content will fill 100% of the main area's width/height

// Type assertion for data (assuming data.ts was fixed as discussed)
const data = rawData as FeatureCollection;

const Home = () => {
  return (
    // 1. Outer Container: content below global + page navbars
    <div 
      style={{
        height: 'calc(100dvh - 64px)',
        minHeight: 'calc(100dvh - 64px)', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
      }}
    >

      {/* 2. Main Content Area: centers heading and map */}
      <main 
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center', 
          alignItems: 'center',    
          flexDirection: 'column', 
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <h1 style={{ 
          marginBottom: '6px', 
          fontSize: 'clamp(1.15rem, 4vw, 2rem)',
          color: 'var(--text-primary)',
          // Ensure heading is centered horizontally too
          textAlign: 'center' 
        }}>Interactive World Map</h1>
        
        {/* 3. Map Wrapper */}
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