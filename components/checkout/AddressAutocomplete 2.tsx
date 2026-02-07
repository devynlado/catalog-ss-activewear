'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { MapPin } from 'lucide-react';

// Define the address structure
export interface ParsedAddress {
  streetNumber: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: ParsedAddress) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

// Parse Google Places address components into our structure
function parseAddressComponents(
  addressComponents: google.maps.GeocoderAddressComponent[]
): ParsedAddress {
  const result: ParsedAddress = {
    streetNumber: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    formattedAddress: '',
  };

  for (const component of addressComponents) {
    const types = component.types;

    if (types.includes('street_number')) {
      result.streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      result.street = component.long_name;
    }
    if (types.includes('locality')) {
      result.city = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      result.state = component.short_name; // Use abbreviation for state
    }
    if (types.includes('postal_code')) {
      result.zipCode = component.long_name;
    }
    if (types.includes('country')) {
      result.country = component.short_name;
    }
  }

  // Combine street number and street name
  result.formattedAddress = [result.streetNumber, result.street]
    .filter(Boolean)
    .join(' ');

  return result;
}

/**
 * Address input with Google Places Autocomplete
 * Falls back to regular input if Google Maps API is not available
 */
export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  label = 'Street Address',
  placeholder = 'Start typing your address...',
  required = false,
  error,
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Check if Google Maps is available
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current) return;
    
    // Check if Google Maps Places API is available
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      setLoadError(true);
      return;
    }

    try {
      // Create autocomplete instance
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'us' }, // Restrict to US addresses
        fields: ['address_components', 'formatted_address'],
        types: ['address'],
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place?.address_components) {
          const parsed = parseAddressComponents(place.address_components);
          
          // Update the input with formatted address
          onChange(parsed.formattedAddress);
          
          // Notify parent of full address data
          onAddressSelect(parsed);
        }
      });

      setIsLoaded(true);
    } catch (err) {
      console.error('Error initializing Google Places Autocomplete:', err);
      setLoadError(true);
    }
  }, [onChange, onAddressSelect]);

  // Initialize on mount
  useEffect(() => {
    // Small delay to ensure Google Maps script is loaded
    const timer = setTimeout(() => {
      initializeAutocomplete();
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup autocomplete listener
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [initializeAutocomplete]);

  // Handle manual input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        label={label}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        error={error}
        disabled={disabled}
        autoComplete="off" // Disable browser autocomplete to avoid conflicts
        className="pl-10"
      />
      <MapPin className="absolute left-3 top-[2.15rem] h-4 w-4 text-slate-400" />
      
      {/* Powered by Google badge (required by Google's terms) */}
      {isLoaded && !loadError && (
        <div className="absolute right-2 top-[2.15rem] flex items-center">
          <span className="text-[8px] text-slate-400">powered by Google</span>
        </div>
      )}
    </div>
  );
}

/**
 * Load Google Maps Places API script
 * Call this in your layout or page component
 */
export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    
    document.head.appendChild(script);
  });
}
