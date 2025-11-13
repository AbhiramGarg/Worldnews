"use client";

import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import React, { useRef, useState, useEffect, useMemo } from 'react';

// --- Reusable Hook for Component Dimensions ---
const useResizeObserver = (ref: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observeTarget = ref.current;
    if (!window.ResizeObserver || !observeTarget) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { contentRect } = entries[0];
      setDimensions({ width: contentRect.width, height: contentRect.height });
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.unobserve(observeTarget);
    };
  }, [ref]);

  return dimensions;
};

// --- D3 Rendering Component ---
type MapProps = {
  width: number;
  height: number;
  data: FeatureCollection;
};

// Map component logic remains D3-based computation
export const Map = React.memo(({ width, height, data }: MapProps) => {
  const allSvgPaths = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    
    // Scale adjusted slightly (from -40 to -30) to make the map look visually larger within the SVG area
    const projection = d3
      .geoMercator()
      .scale(width / 2 / Math.PI - 30) 
      .center([10, 35]);

    const geoPathGenerator = d3.geoPath().projection(projection);

    return data.features
      .filter((shape) => shape.id !== 'ATA')
      .map((shape) => {
        const pathData = geoPathGenerator(shape);
        return (
          <path
            key={shape.id}
            d={pathData || undefined} 
            stroke="lightGrey"
            strokeWidth={0.5}
            fill="grey"
            fillOpacity={0.7}
          />
        );
      });
  }, [width, height, data]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {allSvgPaths}
    </svg>
  );
});

// --- Wrapper Component for Responsiveness and Aspect Ratio ---
export const ResponsiveMap = ({ data }: { data: FeatureCollection }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useResizeObserver(containerRef);
  
  // Target Aspect Ratio (700 wide / 400 high = 1.75)
  const TARGET_ASPECT_RATIO = 1.75; 

  let mapWidth = 0;
  let mapHeight = 0;

  if (containerWidth > 0 && containerHeight > 0) {
    const calculatedHeightBasedOnWidth = containerWidth / TARGET_ASPECT_RATIO;

    if (calculatedHeightBasedOnWidth > containerHeight) {
      // The map is taller than the container (Height is the limiting factor)
      mapHeight = containerHeight;
      mapWidth = containerHeight * TARGET_ASPECT_RATIO;
    } else {
      // The map is wider than the container (Width is the limiting factor)
      mapWidth = containerWidth;
      mapHeight = calculatedHeightBasedOnWidth;
    }
  }

  // The final map container (SVG) needs to be horizontally centered
  return (
    // The container must have 100% height to occupy the space given by the parent
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', position: 'relative' }} 
    >
      {/* Center the final SVG element within the container */}
      <div 
        style={{ 
          width: mapWidth, 
          height: mapHeight, 
          margin: '0 auto', // Horizontal centering for the map
        }}
      >
        {mapWidth > 0 && <Map data={data} width={mapWidth} height={mapHeight} />}
      </div>
    </div>
  );
};