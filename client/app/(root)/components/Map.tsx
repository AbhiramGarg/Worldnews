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
interface MapProps {
  width: number;
  height: number;
  data: FeatureCollection;
}

// --- List of 50 interactive country codes (ISO 3-letter) ---
const INTERACTIVE_COUNTRY_CODES = [
  'USA', 'CAN', 'MEX', 'BRA', 'ARG', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP',
  'RUS', 'CHN', 'IND', 'JPN', 'KOR', 'AUS', 'ZAF', 'EGY', 'TUR', 'SAU',
  'IRN', 'ISR', 'UKR', 'PAK', 'IDN', 'THA', 'VNM', 'PHL', 'NGA', 'ETH',
  'KEN', 'COL', 'PER', 'CHL', 'SWE', 'NOR', 'FIN', 'POL', 'NLD', 'BEL',
  'CHE', 'AUT', 'CZE', 'HUN', 'GRC', 'PRT', 'ROU', 'SRB', 'DNK', 'IRL',
];

// Map component logic remains D3-based computation

export const Map = React.memo(({ width, height, data }: MapProps) => {
  // Track which country is hovered and mouse position
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

  // Build a Set of available country IDs in the data for fast lookup
  const availableCountryIds = useMemo(() => {
    return new Set<string>(data.features.map((f) => (f as { id: string }).id));
  }, [data]);

  // Only allow interactivity for countries in both the 50-list and the data
  const interactiveSet = useMemo(() => {
    return new Set<string>(
      INTERACTIVE_COUNTRY_CODES.filter((code: string) => availableCountryIds.has(code))
    );
  }, [availableCountryIds]);

  const allSvgPaths = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    // Use fitSize to ensure the map fits the SVG area and is centered
    const projection = d3
      .geoMercator()
      .fitSize([width, height], data);

    const geoPathGenerator = d3.geoPath().projection(projection);

    return data.features
      .filter((shape) => (shape as { id: string }).id !== 'ATA')
      .map((shape) => {
        const pathData = geoPathGenerator(shape as any); // shape is a GeoJSON Feature
        const id = (shape as { id: string }).id;
        const isInteractive = interactiveSet.has(id);
        const isHovered = hoveredId === id;
        // Style for interactive countries
        const baseStyle = isInteractive
          ? {
              cursor: 'pointer',
              transition: 'filter 0.2s, fill 0.2s, stroke 0.2s',
              fill: isHovered ? '#00FFFF' : 'grey', // Neon blue on hover, grey otherwise
              stroke: isHovered ? '#00FFFF' : 'lightGrey',
              strokeWidth: isHovered ? 2 : 0.5,
              filter: isHovered ? 'drop-shadow(0px 0px 8px #00FFFF)' : 'none',
              fillOpacity: isHovered ? 0.95 : 0.7,
            }
          : {
              fill: 'grey',
              stroke: 'lightGrey',
              strokeWidth: 0.5,
              fillOpacity: 0.7,
              cursor: 'default',
            };
        // Tooltip handlers
        const handleMouseEnter = isInteractive
          ? (e: React.MouseEvent<SVGPathElement>) => {
              setHoveredId(id);
              const name = (shape as any).properties?.name || id;
              setTooltip({
                name,
                x: e.clientX,
                y: e.clientY,
              });
            }
          : undefined;
        const handleMouseMove = isInteractive
          ? (e: React.MouseEvent<SVGPathElement>) => {
              setTooltip(prev => prev ? {
                ...prev,
                x: e.clientX,
                y: e.clientY,
              } : null);
            }
          : undefined;
        const handleMouseLeave = isInteractive
          ? () => {
              setHoveredId(null);
              setTooltip(null);
            }
          : undefined;
        return (
          <path
            key={id}
            d={pathData || undefined}
            style={baseStyle}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        );
      });
  }, [width, height, data, hoveredId, interactiveSet]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {allSvgPaths}
      </svg>
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y + 8,
            background: 'rgba(30,30,30,0.95)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {tooltip.name}
        </div>
      )}
    </div>
  );
});

// --- Wrapper Component for Responsiveness and Aspect Ratio ---
export const ResponsiveMap = ({ data }: { data: FeatureCollection }) => {
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
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