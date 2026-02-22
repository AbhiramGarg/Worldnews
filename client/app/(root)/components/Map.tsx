"use client";


import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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

// ISO3 -> ISO2 map for navigation (only includes codes used in INTERACTIVE_COUNTRY_CODES)
const ISO3_TO_ISO2: Record<string, string> = {
  USA: 'US', CAN: 'CA', MEX: 'MX', BRA: 'BR', ARG: 'AR', GBR: 'GB', FRA: 'FR', DEU: 'DE', ITA: 'IT', ESP: 'ES',
  RUS: 'RU', CHN: 'CN', IND: 'IN', JPN: 'JP', KOR: 'KR', AUS: 'AU', ZAF: 'ZA', EGY: 'EG', TUR: 'TR', SAU: 'SA',
  IRN: 'IR', ISR: 'IL', UKR: 'UA', PAK: 'PK', IDN: 'ID', THA: 'TH', VNM: 'VN', PHL: 'PH', NGA: 'NG', ETH: 'ET',
  KEN: 'KE', COL: 'CO', PER: 'PE', CHL: 'CL', SWE: 'SE', NOR: 'NO', FIN: 'FI', POL: 'PL', NLD: 'NL', BEL: 'BE',
  CHE: 'CH', AUT: 'AT', CZE: 'CZ', HUN: 'HU', GRC: 'GR', PRT: 'PT', ROU: 'RO', SRB: 'RS', DNK: 'DK', IRL: 'IE',
};

// Map component logic remains D3-based computation

export const Map = React.memo(({ width, height, data }: MapProps) => {
  // Track which country is hovered and mouse position
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [currentTransform, setCurrentTransform] = useState(d3.zoomIdentity);
  const svgRef = useRef<SVGSVGElement>(null);
  const mapGroupRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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

  const router = useRouter();

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const projectedCountries = useMemo(() => {
    if (width <= 0 || height <= 0) return [] as Array<{
      id: string;
      name: string;
      centroid: [number, number];
      bounds: [[number, number], [number, number]];
      isInteractive: boolean;
    }>;

    const projection = d3.geoMercator().fitSize([width, height], data);
    const geoPathGenerator = d3.geoPath().projection(projection);

    return data.features
      .filter((shape) => (shape as { id: string }).id !== 'ATA')
      .map((shape) => {
        const id = (shape as { id: string }).id;
        const centroidRaw = geoPathGenerator.centroid(shape as any);
        const bounds = geoPathGenerator.bounds(shape as any);
        const centroid: [number, number] = [centroidRaw[0], centroidRaw[1]];
        return {
          id,
          name: (shape as any).properties?.name || id,
          centroid,
          bounds,
          isInteractive: interactiveSet.has(id),
        };
      })
      .filter((entry) => Number.isFinite(entry.centroid[0]) && Number.isFinite(entry.centroid[1]));
  }, [width, height, data, interactiveSet]);

  const mobileLabelCountries = useMemo(() => {
    if (!isMobileView || projectedCountries.length === 0) {
      return [] as Array<{ id: string; name: string; centroid: [number, number] }>;
    }

    if (currentTransform.k <= 1.15) {
      const anchorIds = ['USA', 'BRA', 'DEU', 'IND', 'AUS'];
      return anchorIds
        .map((id) => projectedCountries.find((country) => country.id === id))
        .filter((country): country is { id: string; name: string; centroid: [number, number]; bounds: [[number, number], [number, number]]; isInteractive: boolean } => Boolean(country))
        .map(({ id, name, centroid }) => ({ id, name, centroid }));
    }

    const inView = projectedCountries
      .filter((country) => country.isInteractive)
      .filter((country) => {
        const [[minX, minY], [maxX, maxY]] = country.bounds;
        const tMinX = currentTransform.applyX(minX);
        const tMinY = currentTransform.applyY(minY);
        const tMaxX = currentTransform.applyX(maxX);
        const tMaxY = currentTransform.applyY(maxY);
        return tMinX >= 0 && tMinY >= 0 && tMaxX <= width && tMaxY <= height;
      })
      .map(({ id, name, centroid }) => ({
        id,
        name,
        centroid,
        sx: currentTransform.applyX(centroid[0]),
        sy: currentTransform.applyY(centroid[1]),
      }));

    const maxLabels = currentTransform.k >= 5 ? 14 : currentTransform.k >= 3 ? 10 : 8;
    const minScreenDistance = currentTransform.k >= 5 ? 22 : currentTransform.k >= 3 ? 28 : 36;
    const selected: Array<{ id: string; name: string; centroid: [number, number]; sx: number; sy: number }> = [];

    for (const country of inView) {
      const overlaps = selected.some((picked) => {
        const dx = picked.sx - country.sx;
        const dy = picked.sy - country.sy;
        return Math.hypot(dx, dy) < minScreenDistance;
      });

      if (!overlaps) {
        selected.push(country);
      }

      if (selected.length >= maxLabels) break;
    }

    return selected.map(({ id, name, centroid }) => ({ id, name, centroid }));
  }, [isMobileView, projectedCountries, currentTransform, width, height]);

  const mobileLabelFontSize = useMemo(() => {
    if (currentTransform.k <= 1.15) return 5;
    return clamp(8 / Math.sqrt(currentTransform.k), 4, 6.5);
  }, [currentTransform.k]);

  const mobileLabelStrokeWidth = useMemo(() => {
    return clamp(1.8 / Math.sqrt(Math.max(currentTransform.k, 1)), 0.6, 1.2);
  }, [currentTransform.k]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobileView(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !mapGroupRef.current || width <= 0 || height <= 0) return;

    const svgSelection = d3.select(svgRef.current);
    const groupSelection = d3.select(mapGroupRef.current);

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', (event) => {
        groupSelection.attr('transform', event.transform.toString());
        setCurrentTransform(event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;

    svgSelection.call(zoomBehavior as any);

    const mobileStartScale = isMobileView ? 1.8 : 1;
    const initialTransform = d3.zoomIdentity
      .translate((width - width * mobileStartScale) / 2, (height - height * mobileStartScale) / 2)
      .scale(mobileStartScale);
    svgSelection.call(zoomBehavior.transform as any, initialTransform);

    return () => {
      svgSelection.on('.zoom', null);
    };
  }, [width, height, data, isMobileView]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(180)
      .call(zoomBehaviorRef.current.scaleBy as any, 1.35);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(180)
      .call(zoomBehaviorRef.current.scaleBy as any, 1 / 1.35);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(220)
      .call(zoomBehaviorRef.current.transform as any, d3.zoomIdentity);
  };

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
              fill: isHovered ? 'var(--map-hover)' : 'var(--map-country-fill)',
              stroke: isHovered ? 'var(--map-hover)' : 'var(--map-country-stroke)',
              strokeWidth: isHovered ? 2 : 0.5,
              filter: isHovered ? 'drop-shadow(0px 0px 8px var(--map-hover-shadow))' : 'none',
              fillOpacity: isHovered ? 0.95 : 0.7,
            }
          : {
              fill: 'var(--map-country-fill)',
              stroke: 'var(--map-country-stroke)',
              strokeWidth: 0.5,
              fillOpacity: 0.7,
              cursor: 'default',
            };
        // Tooltip handlers
        const handleMouseEnter = isInteractive
          ? (e: React.MouseEvent<SVGPathElement>) => {
              if (isMobileView) return;
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
              if (isMobileView) return;
              setTooltip(prev => prev ? {
                ...prev,
                x: e.clientX,
                y: e.clientY,
              } : null);
            }
          : undefined;
        const handleMouseLeave = isInteractive
          ? () => {
              if (isMobileView) return;
              setHoveredId(null);
              setTooltip(null);
            }
          : undefined;
        const handleClick = isInteractive
          ? () => {
              const iso2 = ISO3_TO_ISO2[id];
              if (iso2) {
                // navigate to filters page and apply country + all topic + all category
                router.push(`/filter?country=${iso2.toLowerCase()}&category=all`);
              }
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
            onClick={handleClick}
          />
        );
      });
  }, [width, height, data, hoveredId, interactiveSet]);

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', touchAction: 'none' }}
      >
        <g ref={mapGroupRef}>
          {allSvgPaths}
          {isMobileView &&
            mobileLabelCountries.map((country) => (
              <text
                key={`label-${country.id}`}
                x={country.centroid[0]}
                y={country.centroid[1]}
                textAnchor="middle"
                style={{
                  fill: '#f8fafc',
                  fontSize: `${mobileLabelFontSize}px`,
                  fontWeight: 700,
                  paintOrder: 'stroke',
                  stroke: 'rgba(15, 23, 42, 0.9)',
                  strokeWidth: mobileLabelStrokeWidth,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {country.name}
              </text>
            ))}
        </g>
      </svg>
      {isMobileView && (
        <div
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 20,
          }}
        >
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: '1.2rem',
              fontWeight: 700,
              boxShadow: '0 4px 10px var(--shadow-color)',
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              fontSize: '1.2rem',
              fontWeight: 700,
              boxShadow: '0 4px 10px var(--shadow-color)',
            }}
          >
            −
          </button>
          <button
            onClick={handleResetZoom}
            aria-label="Reset zoom"
            style={{
              width: 42,
              height: 32,
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--surface-muted)',
              color: 'var(--text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 700,
              boxShadow: '0 4px 10px var(--shadow-color)',
            }}
          >
            Reset
          </button>
        </div>
      )}
      {!isMobileView && tooltip && (
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
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobileView(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  
  // Target Aspect Ratio (700 wide / 400 high = 1.75)
  const TARGET_ASPECT_RATIO = 1.75; 

  let mapWidth = 0;
  let mapHeight = 0;

  if (containerWidth > 0 && containerHeight > 0) {
    if (isMobileView) {
      mapWidth = containerWidth;
      mapHeight = containerHeight;
    } else {
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