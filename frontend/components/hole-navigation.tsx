import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Target, Flag, Wind } from 'lucide-react';

export const HoleNavigation = ({ courseData }) => {
  const [currentHole, setCurrentHole] = useState(1);
  const [holeDetails, setHoleDetails] = useState(null);

  // Get course data from the provided PDF
  const holeData = {
    1: { yards: 374, par: 4 },
    2: { yards: 398, par: 4 },
    3: { yards: 458, par: 4 },
    4: { yards: 500, par: 5 },
    5: { yards: 172, par: 3 },
    6: { yards: 409, par: 4 },
    7: { yards: 520, par: 5 },
    8: { yards: 474, par: 4 },
    9: { yards: 179, par: 3 },
    10: { yards: 377, par: 4 },
    11: { yards: 296, par: 4 },
    12: { yards: 467, par: 4 },
    13: { yards: 128, par: 3 },
    14: { yards: 376, par: 4 },
    15: { yards: 457, par: 4 },
    16: { yards: 552, par: 5 },
    17: { yards: 323, par: 4 },
    18: { yards: 222, par: 3 }
  };                                    //Why are we reading this data feom a pdf?   

  useEffect(() => {
    updateHoleDetails(currentHole);
  }, [currentHole]);

  const updateHoleDetails = (holeNumber) => {
    const details = holeData[holeNumber];
    // Get additional hole details from course.js functions
    const teeLocation = {
      lat: getCourseHoleTeeLat(0, holeNumber),
      lon: getCourseHoleTeeLon(0, holeNumber)
    };
    const pinLocation = {
      lat: getCourseHolePinLat(0, holeNumber),
      lon: getCourseHolePinLon(0, holeNumber)
    };

    setHoleDetails({
      ...details,
      teeLocation,
      pinLocation,
      // Add shot points if they exist
      targets: [1, 2, 3].map(i => ({
        lat: getCourseHoleTargetLat(0, holeNumber, i),
        lon: getCourseHoleTargetLon(0, holeNumber, i)
      })).filter(target => target.lat !== 0 || target.lon !== 0)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentHole(prev => Math.max(1, prev - 1))}
          className="p-2 bg-blue-100 rounded-full hover:bg-blue-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold">Hole {currentHole}</h2>
          <p className="text-lg">Par {holeDetails?.par}</p>
        </div>

        <button
          onClick={() => setCurrentHole(prev => Math.min(18, prev + 1))}
          className="p-2 bg-blue-100 rounded-full hover:bg-blue-200"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {holeDetails && (
        <div className="space-y-4">
          <HoleStats details={holeDetails} />
          <HolePath details={holeDetails} />
          <PlayingTips details={holeDetails} />
        </div>
      )}
    </div>
  );
};

const HoleStats = ({ details }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <p className="text-sm text-gray-500">Distance</p>
        <p className="text-xl font-bold">{details.yards} yards</p>
      </div>
      <div className="text-center border-l border-r">
        <p className="text-sm text-gray-500">Elevation</p>
        <p className="text-xl font-bold">{details.elevation || '--'}</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500">Index</p>
        <p className="text-xl font-bold">{details.index || '--'}</p>
      </div>
    </div>
  );
};

const HolePath = ({ details }) => {
  return (
    <div className="relative h-32 bg-green-50 rounded-lg p-4">
      <div className="absolute inset-0 flex items-center justify-between px-8">
        {/* Tee Box */}
        <div className="flex flex-col items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full" />
          <span className="text-sm mt-1">Tee</span>
        </div>

        {/* Target Points */}
        {details.targets.map((target, index) => (
          <div key={index} className="flex flex-col items-center">
            <Target className="w-4 h-4 text-yellow-500" />
            <span className="text-sm mt-1">{`T${index + 1}`}</span>
          </div>
        ))}

        {/* Pin */}
        <div className="flex flex-col items-center">
          <Flag className="w-4 h-4 text-red-500" />
          <span className="text-sm mt-1">Pin</span>
        </div>
      </div>

      {/* Distance Lines */}
      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gray-300" />
    </div>
  );
};

const PlayingTips = ({ details }) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Playing Tips</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <Target className="w-4 h-4 mr-2" />
          <span>Ideal tee shot: {details.idealTeeShot || 'Center of fairway'}</span>
        </div>
        <div className="flex items-center">
          <Wind className="w-4 h-4 mr-2" />
          <span>Watch for: {details.watchFor || 'Prevailing wind from right'}</span>
        </div>
        <div className="flex items-center">
          <Flag className="w-4 h-4 mr-2" />
          <span>Green characteristics: {details.greenCharacteristics || 'Slight back to front slope'}</span>
        </div>
      </div>
    </div>
  );
};

export default HoleNavigation;
