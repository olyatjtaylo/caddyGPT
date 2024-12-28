
// frontend/src/components/CourseMap.js
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const CourseMap = ({ course, userLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const courseMarkers = useRef([]);

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [userLocation.lng || -98.5795, userLocation.lat || 39.8283], // Default to USA center
      zoom: 12,
    });
  }, [userLocation]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !userLocation.lat || !userLocation.lng) return;

    if (userMarker.current) {
      userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      userMarker.current = new mapboxgl.Marker({ color: 'blue' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    }
  }, [userLocation]);

  // Render course markers
  useEffect(() => {
    if (!map.current || !course?.holes) return;

    // Clear existing markers
    courseMarkers.current.forEach(marker => marker.remove());
    courseMarkers.current = [];

    course.holes.forEach(hole => {
      const marker = new mapboxgl.Marker({ color: 'green' })
        .setLngLat([hole.longitude, hole.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Hole ${hole.holeNumber}</h3><p>Par: ${hole.par}</p><p>Yardage: ${hole.yardage}</p>`))
        .addTo(map.current);

      courseMarkers.current.push(marker);
    });
  }, [course]);

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
};

export default CourseMap;
