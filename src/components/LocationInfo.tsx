import { MapPin, Building, Globe2, X } from 'lucide-react';
import type { LocationData } from '../types';

interface LocationInfoProps {
  data: LocationData;
  onClose: () => void;
}

export default function LocationInfo({ data, onClose }: LocationInfoProps) {
  const city = data.address.city || data.address.town || data.address.village || '';
  const state = data.address.state || '';
  const country = data.address.country || '';

  return (
    <div className="fixed bottom-4 left-4 z-[1000] w-[90vw] max-w-md 
                  bg-white/90 backdrop-blur-sm 
                  rounded-lg shadow-lg p-4 animate-slide-up
                  border border-gray-200
                  transition-all duration-200">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1.5 
                 hover:bg-gray-100/80
                 rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>

      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-900">
          {city}
        </h3>
        <p className="text-gray-600">
          {state && `${state}, `}{country}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 group">
          <div className="p-2 rounded-full bg-blue-50
                        group-hover:bg-blue-100
                        transition-colors">
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Coordinates
            </p>
            <p className="text-gray-600">
              {parseFloat(data.lat).toFixed(6)}, {parseFloat(data.lon).toFixed(6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 group">
          <div className="p-2 rounded-full bg-blue-50
                        group-hover:bg-blue-100
                        transition-colors">
            <Building className="w-5 h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Address
            </p>
            <p className="text-gray-600 truncate">
              {data.display_name}
            </p>
          </div>
        </div>

        {data.address.postcode && (
          <div className="flex items-center gap-3 group">
            <div className="p-2 rounded-full bg-blue-50
                          group-hover:bg-blue-100
                          transition-colors">
              <Globe2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Postal Code
              </p>
              <p className="text-gray-600">
                {data.address.postcode}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}