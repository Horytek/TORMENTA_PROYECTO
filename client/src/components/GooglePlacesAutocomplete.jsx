import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@heroui/react';

const GooglePlacesAutocomplete = ({ 
  value, 
  onChange, 
  label = "Ubicación", 
  placeholder = "Buscar dirección...",
  isInvalid,
  errorMessage,
  isRequired,
  variant = "bordered",
  className,
  onPlaceSelect, // Callback adicional cuando se selecciona un lugar
  ...props 
}) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteElementRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Verificar si Google Maps está disponible
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
      setIsLoaded(true);
    } else {
      // Cargar Google Maps script si no está disponible
      loadGoogleMapsScript();
    }

    return () => {
      if (autocompleteElementRef.current) {
        autocompleteElementRef.current.remove?.();
      }
    };
  }, []);

  const loadGoogleMapsScript = () => {
    // Verificar si ya existe el script
    if (document.getElementById('google-maps-script')) {
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY no está configurada');
      setLoadError(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error('Error cargando Google Maps API');
      setLoadError(true);
    };

    // Callback global para cuando se carga el script
    window.initGoogleMaps = () => {
      initializeAutocomplete();
      setIsLoaded(true);
    };

    document.head.appendChild(script);
  };

  const initializeAutocomplete = () => {
    if (!containerRef.current || !window.google) return;

    try {
      // Usar el nuevo PlaceAutocompleteElement recomendado por Google
      if (window.google.maps.places.PlaceAutocompleteElement) {
        // Crear el nuevo elemento
        autocompleteElementRef.current = new window.google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: 'pe' },
          types: ['address'],
          fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
        });

        // Configurar el estilo del elemento
        autocompleteElementRef.current.style.width = '100%';
        autocompleteElementRef.current.style.height = '40px';
        
        // Escuchar cambios de lugar
        autocompleteElementRef.current.addEventListener('gmp-placeselected', (event) => {
          const place = event.detail.place;
          
          if (place.formattedAddress) {
            onChange(place.formattedAddress);
            
            // Callback adicional con información completa del lugar
            if (onPlaceSelect) {
              onPlaceSelect({
                address: place.formattedAddress,
                geometry: place.geometry,
                placeId: place.placeId,
                addressComponents: place.addressComponents
              });
            }
          }
        });

        // Insertar el elemento en el contenedor
        if (containerRef.current) {
          containerRef.current.appendChild(autocompleteElementRef.current);
        }

      } else {
        // Fallback al método anterior para compatibilidad
        console.warn('PlaceAutocompleteElement no disponible, usando Autocomplete legacy');
        initializeLegacyAutocomplete();
      }
    } catch (error) {
      console.error('Error inicializando Google Places:', error);
      // Intentar con el método legacy como fallback
      initializeLegacyAutocomplete();
    }
  };

  const initializeLegacyAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'pe' },
          fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.formatted_address) {
          onChange(place.formatted_address);
          
          if (onPlaceSelect) {
            onPlaceSelect({
              address: place.formatted_address,
              geometry: place.geometry,
              placeId: place.place_id,
              addressComponents: place.address_components
            });
          }
        }
      });
    } catch (error) {
      console.error('Error inicializando legacy autocomplete:', error);
      setLoadError(true);
    }
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    
    // Si estamos usando el nuevo elemento, sincronizar el valor
    if (autocompleteElementRef.current && autocompleteElementRef.current.value !== e.target.value) {
      autocompleteElementRef.current.value = e.target.value;
    }
  };

  const getPlaceholder = () => {
    if (loadError) return "Error cargando lugares";
    if (!isLoaded) return "Cargando lugares...";
    return placeholder;
  };

  const getEndContent = () => {
    if (loadError) {
      return (
        <div className="flex items-center text-red-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    
    if (!isLoaded) {
      return (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div className="flex items-center text-gray-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  // Si usamos el nuevo elemento, mostramos solo el contenedor
  if (isLoaded && autocompleteElementRef.current && !loadError) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div 
          ref={containerRef} 
          className="relative w-full"
          style={{ minHeight: '40px' }}
        />
        {isInvalid && errorMessage && (
          <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Fallback al input tradicional
  return (
    <div className={className}>
      <Input
        ref={inputRef}
        label={label}
        placeholder={getPlaceholder()}
        value={value || ''}
        onChange={handleInputChange}
        isInvalid={isInvalid || loadError}
        errorMessage={loadError ? "Error al cargar Google Maps" : errorMessage}
        isRequired={isRequired}
        variant={variant}
        disabled={!isLoaded || loadError}
        endContent={getEndContent()}
        {...props}
      />
      {loadError && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <p className="text-xs text-red-500 mt-1">
          Configurar VITE_GOOGLE_MAPS_API_KEY en variables de entorno
        </p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
