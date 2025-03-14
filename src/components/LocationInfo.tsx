import { useState } from 'react';
import { MapPin, Building, Globe2, X, Copy, Check } from 'lucide-react';
import type { LocationData } from '../types';

interface LocationInfoProps {
  data: LocationData;
  onClose: () => void;
}

export default function LocationInfo({ data, onClose }: LocationInfoProps) {
  const [showToast, setShowToast] = useState(false);
  const [copiedField, setCopiedField] = useState<string>('');
  
  const city = data.address.city || data.address.town || data.address.village || '';
  const state = data.address.state || '';
  const country = data.address.country || '';

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setCopiedField('');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[1000] w-[90vw] max-w-md 
                  bg-white/90 backdrop-blur-sm 
                  rounded-lg shadow-lg p-4 animate-slide-up
                  border border-gray-200
                  transition-all duration-200">
      {showToast && (
        <div className="fixed top-4 right-4 z-[1001] bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{copiedField} copied to clipboard!</span>
        </div>
      )}

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
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Coordinates
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-gray-600">
                {parseFloat(data.lat).toFixed(6)}, {parseFloat(data.lon).toFixed(6)}
              </p>
              <button
                onClick={() => handleCopy(`${parseFloat(data.lat).toFixed(6)}, ${parseFloat(data.lon).toFixed(6)}`, 'Coordinates')}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Copy coordinates"
              >
                {copiedField === 'Coordinates' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 group">
          <div className="p-2 rounded-full bg-blue-50
                        group-hover:bg-blue-100
                        transition-colors">
            <Building className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Address
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-gray-600 truncate">
                {data.display_name}
              </p>
              <button
                onClick={() => handleCopy(data.display_name, 'Address')}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Copy address"
              >
                {copiedField === 'Address' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {data.address.postcode && (
          <div className="flex items-center gap-3 group">
            <div className="p-2 rounded-full bg-blue-50
                          group-hover:bg-blue-100
                          transition-colors">
              <Globe2 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Postal Code
              </p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-gray-600">
                  {data.address.postcode}
                </p>
                <button
                  onClick={() => data.address.postcode && handleCopy(data.address.postcode, 'Postal code')}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Copy postal code"
                >
                  {copiedField === 'Postal code' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}