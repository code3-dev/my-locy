import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import LocationInfo from './components/LocationInfo';
import LocationWidget from './components/LocationWidget';
import type { LocationData } from './types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  const currentZoom = map.getZoom();
  map.setView(center, currentZoom);
  return null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function App() {
  const [center, setCenter] = useState<[number, number]>([51.505, -0.09]); // Default to London
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectLocation = async (lat: number, lon: number) => {
    setCenter([lat, lon]);
    setLoading(true);
    
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      setLocationData(response.data);
    } catch (error) {
      console.error('Error fetching location data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen relative">
      <SearchBar onSelectLocation={handleSelectLocation} />
      
      <LocationWidget onLocationSelect={handleSelectLocation} locationData={locationData} />
      
      {locationData && (
        <LocationInfo
          data={locationData}
          onClose={() => setLocationData(null)}
        />
      )}

      {loading && (
        <div className="absolute top-16 right-4 z-[1000] bg-blue-500/90 backdrop-blur-sm 
                      text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading location info...</span>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full transition-all duration-300"
        zoomControl={false}
        attributionControl={false}
        minZoom={1}
        maxZoom={18}
      >
        <ChangeView center={center} />
        <MapClickHandler onLocationSelect={handleSelectLocation} />
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={defaultIcon} />
      </MapContainer>
    </div>
  );
}

export default App;