import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { FiMapPin, FiNavigation, FiExternalLink } from "react-icons/fi";

// Coords dictionary for well-known Himalayan locations if coordinates are missing or approximate
const HIMALAYAN_HUBS = {
  manali: [32.2432, 77.1892],
  kasol: [32.0100, 77.3152],
  jibhi: [31.6375, 77.3484],
  tirthan: [31.6426, 77.3512],
  chopta: [30.4853, 79.1764],
  rishikesh: [30.0869, 78.2676],
  mussoorie: [30.4598, 78.0644],
  shimla: [31.1048, 77.1734],
  spiti: [32.2461, 78.0349],
  kaza: [32.2276, 78.0710],
  leh: [34.1526, 77.5771],
  ladakh: [34.1526, 77.5771],
  pahalgam: [34.0150, 75.3190],
  gulmarg: [34.0484, 74.3805],
  munsyari: [30.0668, 80.2394],
  dharamshala: [32.2190, 76.3234],
  mcleodganj: [32.2426, 76.3213],
  bir: [32.0519, 76.7176],
  uttarkashi: [30.7268, 78.4354],
};

// Fallback coordinate extractor
export const resolvePlotCoordinates = (spot) => {
  if (spot?.coordinates?.lat && spot?.coordinates?.lng) {
    return [Number(spot.coordinates.lat), Number(spot.coordinates.lng)];
  }
  if (spot?.latitude && spot?.longitude) {
    return [Number(spot.latitude), Number(spot.longitude)];
  }
  if (spot?.location) {
    const locLower = spot.location.toLowerCase();
    for (const [key, coords] of Object.entries(HIMALAYAN_HUBS)) {
      if (locLower.includes(key)) {
        // Add tiny deterministic jitter based on title to separate overlapping pins
        const hash = (spot.title || spot._id || "a")
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const jitterLat = ((hash % 10) - 5) * 0.005;
        const jitterLng = (((hash * 3) % 10) - 5) * 0.005;
        return [coords[0] + jitterLat, coords[1] + jitterLng];
      }
    }
  }
  // Default Himalayan center (near Himachal/Uttarakhand border)
  return [32.2432, 77.1892];
};

// Helper component to auto-pan / fit bounds
function MapBoundsUpdater({ points, center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (points && points.length > 1) {
      const validPoints = points.filter((p) => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [map, points, center, zoom]);

  return null;
}

// Custom Saffron & Navy HTML marker
const createCustomMarker = (spot, isSelected = false) => {
  const price = spot?.pricePerHour ? `₹${spot.pricePerHour}/h` : "★ Plot";
  return L.divIcon({
    className: "thikana-map-pin-wrapper",
    html: `
      <div class="relative group cursor-pointer transform transition-transform duration-200 hover:scale-110 ${
        isSelected ? "scale-110 z-50" : "z-20"
      }">
        <div class="px-2.5 py-1 bg-navy text-white text-xs font-bold rounded-full shadow-lg border-2 ${
          isSelected ? "border-saffron bg-navy ring-4 ring-saffron/30" : "border-saffron hover:bg-navy-deep"
        } flex items-center gap-1.5 whitespace-nowrap transition-colors">
          <span class="w-2 h-2 rounded-full bg-saffron inline-block animate-pulse"></span>
          <span>${price}</span>
        </div>
        <div class="w-2.5 h-2.5 bg-navy border-r-2 border-b-2 border-saffron transform rotate-45 mx-auto -mt-1.5"></div>
      </div>
    `,
    iconSize: [60, 36],
    iconAnchor: [30, 36],
    popupAnchor: [0, -36],
  });
};

// Safe Map Error Boundary to prevent Leaflet hook or initialization errors from crashing the route
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn("MountainMap caught a Leaflet rendering error:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[280px] bg-dusk/20 border border-mist/80 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <span className="text-3xl mb-2">🗺️</span>
          <h4 className="font-heading font-bold text-sm text-navy mb-1">
            Himalayan Terrain Map
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mb-3">
            Interactive map preview unavailable. Coordinates and location details are preserved.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function MountainMapInner({
  spots = [],
  singleSpot = null,
  selectedSpotId = null,
  onSpotSelect = null,
  className = "w-full h-96 rounded-2xl overflow-hidden shadow-inner",
  zoom = 12,
}) {
  const plotList = singleSpot ? [singleSpot] : spots;

  const validPlots = plotList
    .map((spot) => ({
      spot,
      coords: resolvePlotCoordinates(spot),
    }))
    .filter((item) => !isNaN(item.coords[0]) && !isNaN(item.coords[1]));

  const defaultCenter = singleSpot
    ? resolvePlotCoordinates(singleSpot)
    : validPlots.length > 0
    ? validPlots[0].coords
    : [32.2432, 77.1892];

  const allCoords = validPlots.map((item) => item.coords);

  return (
    <div className={`relative ${className} border border-mist/80 bg-snow z-0`}>
      <MapContainer
        center={defaultCenter}
        zoom={singleSpot ? zoom : 10}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ minHeight: "100%", background: "#E4E7EF" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapBoundsUpdater points={allCoords} center={defaultCenter} zoom={zoom} />

        {validPlots.map(({ spot, coords }) => {
          const isSelected = selectedSpotId === spot._id;
          const imageUrl =
            spot.images && spot.images[0]
              ? spot.images[0]
              : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80";

          return (
            <Marker
              key={spot._id}
              position={coords}
              icon={createCustomMarker(spot, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSpotSelect) onSpotSelect(spot);
                },
              }}
            >
              <Popup className="thikana-leaflet-popup">
                <div className="w-56 p-1 text-navy font-sans">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 shadow-sm">
                    <img
                      src={imageUrl}
                      alt={spot.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-navy/90 backdrop-blur text-saffron text-[10px] font-bold px-2 py-0.5 rounded-full border border-saffron/30">
                      ₹{spot.pricePerHour}/hr
                    </div>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-navy line-clamp-1 mb-0.5">
                    {spot.title}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2 line-clamp-1">
                    <FiMapPin className="text-saffron shrink-0" />
                    <span>{spot.location}</span>
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-mist/60 text-xs">
                    <span className="text-[11px] font-semibold text-pine flex items-center gap-1">
                      <FiNavigation className="text-[10px]" />
                      Verified Terrain
                    </span>
                    <Link
                      to={`/spots/${spot._id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:text-saffron-text transition-colors"
                    >
                      View Plot <FiExternalLink className="text-[10px]" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating altitude & terrain indicator badge */}
      <div className="absolute bottom-3 left-3 z-[400] bg-navy/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-medium border border-saffron/30 shadow-lg flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-saffron animate-ping"></span>
        <span className="text-snow">Himalayan Topography & Plots Map</span>
      </div>
    </div>
  );
}

export default function MountainMap(props) {
  return (
    <MapErrorBoundary>
      <MountainMapInner {...props} />
    </MapErrorBoundary>
  );
}
