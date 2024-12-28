
// frontend/src/components/CourseMap.js
import React, { useEffect, useRef } from 'react';

const CourseMap = ({ course }) => {
  const mapContainer = useRef(null);

  useEffect(() => {
    // Placeholder for map rendering logic (e.g., Mapbox or Leaflet.js)
    if (course) {
      console.log('Rendering map for course:', course.name);
      // TODO: Add Mapbox or Leaflet.js map rendering here
    }
  }, [course]);

  return (
    <div>
      <h2>Course Map: {course.name}</h2>
      <div ref={mapContainer} style={{ height: '500px', width: '100%', border: '1px solid black' }}>
        {/* Map will be rendered here */}
      </div>
    </div>
  );
};

export default CourseMap;
