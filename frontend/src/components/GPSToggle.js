
// frontend/src/components/GPSToggle.js
import React, { useState, useEffect } from 'react';

const GPSToggle = ({ onLocationUpdate }) => {
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [error, setError] = useState(null);
  let watchId;

  useEffect(() => {
    if (gpsEnabled) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onLocationUpdate({ lat: latitude, lng: longitude });
          },
          (err) => setError(err.message),
          { enableHighAccuracy: true }
        );
      } else {
        setError('Geolocation is not supported by your browser.');
      }
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [gpsEnabled, onLocationUpdate]);

  return (
    <div className="gps-toggle">
      <button onClick={() => setGpsEnabled(!gpsEnabled)}>
        {gpsEnabled ? 'Disable GPS' : 'Enable GPS'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default GPSToggle;
