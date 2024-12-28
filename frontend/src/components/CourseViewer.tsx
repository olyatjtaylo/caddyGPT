
// frontend/src/components/CourseViewer.tsx
import React, { useState } from 'react';
import CesiumMap from './CesiumMap'; // Assume this is the 3D map component
import MapboxMap from './MapboxMap'; // Assume this is the 2D map component
import HoleDetails from './HoleDetails'; // Yardage Book Component

const CourseViewer = ({ course }: { course: { id: number; name: string } }) => {
  const [mapType, setMapType] = useState('mapbox'); // Default to Mapbox

  return (
    <div className="course-viewer">
      <div className="map-toggle-buttons">
        <button onClick={() => setMapType('mapbox')} disabled={mapType === 'mapbox'}>
          Mapbox
        </button>
        <button onClick={() => setMapType('cesium')} disabled={mapType === 'cesium'}>
          Cesium
        </button>
      </div>

      <div className="map-container">
        {mapType === 'mapbox' ? <MapboxMap course={course} /> : <CesiumMap course={course} />}
      </div>

      <HoleDetails courseId={course.id} />
    </div>
  );
};

export default CourseViewer;
