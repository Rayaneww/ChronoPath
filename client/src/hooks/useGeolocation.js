import { useState, useEffect } from 'react';

const DEFAULT_POSITION = { lat: 48.8566, lng: 2.3522 }; // Paris

export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(DEFAULT_POSITION);
      setError('Géolocalisation non supportée par votre navigateur');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => {
        setPosition(DEFAULT_POSITION);
        setError('Autorisez la géolocalisation pour un meilleur résultat');
      }
    );
  }, []);

  return { position, error };
}
