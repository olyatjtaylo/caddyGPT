import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Wind, Flag, Navigation } from 'lucide-react';

// Component for the complete hole view with map and data
export const CourseViewer = () => {
  const [currentHole, setCurrentHole] = useState(1);
  const [courseView, setCourseView] = useState({
    type: 'satellite',  // or 'terrain' or 'elevation'
    zoom: 17
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Main Course View */}
      <div className="lg:col-span-2">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <HoleSelector 
              currentHole={currentHole} 
              onHoleChange={setCurrentHole} 
            />
            <ViewControls 
              view={courseView} 
              onViewChange={setCourseView} 
            />
          </div>
          
          <CourseMap 
            holeNumber={currentHole}
            view={courseView}
          />
          
          <DistanceOverlay holeNumber={currentHole} />
        </Card>
      </div>

      {/* Side Panel */}
      <div className="space-y-4">
        <HoleDetails holeNumber={currentHole} />
        <ShotPlanner holeNumber={currentHole} />
      </div>
    </div>
  );
};

// Hole selector with thumbnails
const HoleSelector = ({ currentHole, onHoleChange }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto p-2 bg-gray-50 rounded-lg">
      {Array.from({length: 18}, (_, i) => i + 1).map(hole => (
        <button
          key={hole}
          onClick={() => onHoleChange(hole)}
          className={`
            flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
            ${currentHole === hole 
              ? 'bg-blue-600 text-white' 
              : 'bg-white border-2 border-gray-200 hover:border-blue-400'}
          `}
        >
          {hole}
        </button>
      ))}
    </div>
  );
};

// View type and zoom controls
const ViewControls = ({ view, onViewChange }) => {
  return (
    <div className="flex space-x-2">
      <select
        value={view.type}
        onChange={(e) => onViewChange({...view, type: e.target.value})}
        className="rounded-lg border p-2"
      >
        <option value="satellite">Satellite</option>
        <option value="terrain">Terrain</option>
        <option value="elevation">Elevation</option>
      </select>
      
      <button
        onClick={() => onViewChange({...view, zoom: view.zoom + 1})}
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
      >
        +
      </button>
      
      <button
        onClick={() => onViewChange({...view, zoom: view.zoom - 1})}
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
      >
        -
      </button>
    </div>
  );
};

// Course map with Cesium integration
const CourseMap = ({ holeNumber, view }) => {
  const mapRef = useRef(null);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Initialize Cesium viewer similar to course.js
    const viewer = new Cesium.Viewer(mapRef.current, {
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
    });

    // Add hole features
    addHoleFeatures(viewer, holeNumber);

    return () => {
      viewer.destroy();
    };
  }, [holeNumber, view]);

  return (
    <div ref={mapRef} className="w-full h-[600px] rounded-lg overflow-hidden" />
  );
};

// Distance overlay component
const DistanceOverlay = ({ holeNumber }) => {
  return (
    <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-yellow-400" />
          <span>Carry Distance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-white border border-gray-300" />
          <span>Total Distance</span>
        </div>
      </div>
    </div>
  );
};

// Hole details panel
const HoleDetails = ({ holeNumber }) => {
  const holeData = {
    1: { yards: 374, par: 4 },
    2: { yards: 398, par: 4 },
    // ... (rest of hole data)
  }[holeNumber];

  return (
    <Card className="p-4">
      <h3 className="text-xl font-bold mb-4">Hole {holeNumber}</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Par</div>
          <div className="text-2xl font-bold">{holeData.par}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Yards</div>
          <div className="text-2xl font-bold">{holeData.yards}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Index</div>
          <div className="text-2xl font-bold">7</div>
        </div>
      </div>

      <div className="space-y-4">
        <ElevationProfile holeNumber={holeNumber} />
        <ShotStrategy holeNumber={holeNumber} />
        <HazardInfo holeNumber={holeNumber} />
      </div>
    </Card>
  );
};

// Shot planner component
const ShotPlanner = ({ holeNumber }) => {
  const [selectedClub, setSelectedClub] = useState(null);
  const [windData, setWindData] = useState({ speed: 5, direction: "NW" });

  return (
    <Card className="p-4">
      <h3 className="text-xl font-bold mb-4">Shot Planner</h3>
      
      {/* Wind Information */}
      <div className="flex items-center space-x-4 mb-4">
        <Wind className="w-6 h-6" />
        <div>
          <div className="text-sm text-gray-500">Wind</div>
          <div>{windData.speed} mph {windData.direction}</div>
        </div>
      </div>

      {/* Club Selection */}
      <div className="space-y-2 mb-4">
        {playerClubs.map(club => (
          <button
            key={club.name}
            onClick={() => setSelectedClub(club)}
            className={`w-full p-2 rounded ${
              selectedClub?.name === club.name 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {club.name} - {club.total}y
          </button>
        ))}
      </div>

      {/* Shot Information */}
      {selectedClub && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Carry</div>
              <div className="font-bold">{selectedClub.carry}y</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total</div>
              <div className="font-bold">{selectedClub.total}y</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// Helper function to add hole features to the map
const addHoleFeatures = (viewer, holeNumber) => {
  // Clear existing entities
  viewer.entities.removeAll();

  // Add tee box
  const teeLat = getCourseHoleTeeLat(0, holeNumber);
  const teeLon = getCourseHoleTeeLon(0, holeNumber);
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(teeLon, teeLat),
    billboard: {
      image: '/images/tee-marker.png',
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  });

  // Add target points
  for (let i = 1; i <= 3; i++) {
    const targetLat = getCourseHoleTargetLat(0, holeNumber, i);
    const targetLon = getCourseHoleTargetLon(0, holeNumber, i);
    if (targetLat !== 0 || targetLon !== 0) {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(targetLon, targetLat),
        billboard: {
          image: '/images/target-marker.png',
          verticalOrigin: Cesium.VerticalOrigin.CENTER
        }
      });
    }
  }

  // Add pin
  const pinLat = getCourseHolePinLat(0, holeNumber);
  const pinLon = getCourseHolePinLon(0, holeNumber);
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(pinLon, pinLat),
    billboard: {
      image: '/images/pin-marker.png',
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    }
  });

  // Add center line
  const centerLineCoords = [
    teeLon, teeLat,
    // Add target points
    ...getTargetCoords(holeNumber),
    pinLon, pinLat
  ];

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray(centerLineCoords),
      width: 2,
      material: new Cesium.Color(1.0, 1.0, 1.0, 0.5)
    }
  });
};

export default CourseViewer;