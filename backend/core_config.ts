// Configuration for the complete system
// config/index.ts
import { config } from 'dotenv';
config();

export const CONFIG = {
  DATABASE: {
    URL: process.env.DATABASE_URL,
    MAX_CONNECTIONS: 20,
    SSL: process.env.NODE_ENV === 'production'
  },
  APIS: {
    WEATHER_KEY: process.env.OPENWEATHER_API_KEY,
    CESIUM_TOKEN: process.env.CESIUM_TOKEN
  },
  CACHE: {
    REDIS_URL: process.env.REDIS_URL,
    TTL: 3600
  }
};

// Core services implementation
// services/index.ts
import axios from 'axios';
import Redis from 'ioredis';
import * as Cesium from 'cesium';

const redis = new Redis(CONFIG.CACHE.REDIS_URL);

export class WeatherService {
  async getConditions(lat: number, lon: number) {
    const cacheKey = `weather:${lat}:${lon}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.APIS.WEATHER_KEY}`
    );

    const data = {
      temp: response.data.main.temp,
      wind: response.data.wind,
      conditions: response.data.weather[0]
    };

    await redis.setex(cacheKey, CONFIG.CACHE.TTL, JSON.stringify(data));
    return data;
  }
}

export class ShotCalculator {
  calculateAdjustedDistance(params: {
    baseDistance: number;
    elevation: number;
    windSpeed: number;
    windDirection: number;
    temperature: number;
  }) {
    const { baseDistance, elevation, windSpeed, windDirection, temperature } = params;
    
    // Elevation adjustment (2% per 100ft)
    const elevationFactor = 1 + (elevation / 100) * 0.02;
    
    // Wind adjustment
    const windAngle = Math.abs(windDirection % 360);
    const windFactor = 1 - (windSpeed * Math.cos(windAngle * Math.PI / 180) * 0.01);
    
    // Temperature adjustment (1% per 10°F from 70°F)
    const tempFactor = 1 + ((temperature - 70) / 10) * 0.01;
    
    return baseDistance * elevationFactor * windFactor * tempFactor;
  }
}

// Course visualization component
// components/CourseViewer.tsx
import React, { useEffect, useRef } from 'react';
import { Ion, Viewer, Entity, Cartesian3 } from 'cesium';

Ion.defaultAccessToken = CONFIG.APIS.CESIUM_TOKEN;

export const CourseViewer: React.FC<{
  courseId: number;
  holeNumber: number;
}> = ({ courseId, holeNumber }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cesium viewer
    const viewer = new Viewer(containerRef.current, {
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
      useDefaultRenderLoop: true
    });

    viewerRef.current = viewer;

    // Clean up
    return () => {
      viewer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;
    drawHole(holeNumber);
  }, [holeNumber]);

  const drawHole = async (hole: number) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.entities.removeAll();

    // Add tee box
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(-85.00940140094001, 35.889605088961),
      billboard: {
        image: '/images/tee-marker.png',
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      }
    });

    // Add fairway line
    viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          -85.00940140094001, 35.889605088961,
          -85.01089990109, 35.887693488769,
          -85.01218060121801, 35.887635888764
        ]),
        width: 2,
        material: new Cesium.Color(1.0, 1.0, 1.0, 0.5)
      }
    });

    // Add pin
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(-85.01218060121801, 35.887635888764),
      billboard: {
        image: '/images/pin-marker.png',
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      }
    });
  };

  return (
    <div className="relative h-[600px]">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10">
        <h3 className="font-bold text-lg">Hole {holeNumber}</h3>
        <WeatherOverlay />
      </div>
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-10">
        <ShotPlanner />
      </div>
    </div>
  );
};

// Shot planning component
// components/ShotPlanner.tsx
export const ShotPlanner: React.FC<{
  clubs: any[];
  onShotPlan: (plan: any) => void;
}> = ({ clubs, onShotPlan }) => {
  const [selectedClub, setSelectedClub] = useState(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const calculator = new ShotCalculator();

  const handlePlanShot = () => {
    if (!selectedClub || !distance) return;

    const windData = {
      speed: 5, // Mock data - replace with real weather data
      direction: 45
    };

    const adjustedDistance = calculator.calculateAdjustedDistance({
      baseDistance: distance,
      elevation: elevation || 0,
      windSpeed: windData.speed,
      windDirection: windData.direction,
      temperature: 70 // Mock data
    });

    onShotPlan({
      club: selectedClub,
      originalDistance: distance,
      adjustedDistance,
      conditions: {
        wind: windData,
        elevation
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {clubs.map(club => (
          <button
            key={club.name}
            onClick={() => setSelectedClub(club)}
            className={`p-2 rounded ${
              selectedClub?.name === club.name 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100'
            }`}
          >
            {club.name}
          </button>
        ))}
      </div>

      {selectedClub && (
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium">Carry Distance</label>
            <p className="text-2xl font-bold">{selectedClub.carry} yards</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Total Distance</label>
            <p className="text-2xl font-bold">{selectedClub.total} yards</p>
          </div>
          <button
            onClick={handlePlanShot}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded"
          >
            Plan Shot
          </button>
        </div>
      )}
    </div>
  );
};

// Weather overlay component
// components/WeatherOverlay.tsx
export const WeatherOverlay: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);
  const weatherService = new WeatherService();

  useEffect(() => {
    const fetchWeather = async () => {
      const conditions = await weatherService.getConditions(
        35.889605088961,
        -85.00940140094001
      );
      setWeather(conditions);
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-500">Temperature</p>
        <p className="text-xl font-bold">{weather.temp}°F</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Wind</p>
        <p className="text-xl font-bold">{weather.wind.speed} mph</p>
        <p className="text-sm">{weather.wind.deg}°</p>
      </div>
    </div>
  );
};

// Usage example
// pages/course/[id].tsx
export default function CoursePage({ courseId }: { courseId: string }) {
  const [currentHole, setCurrentHole] = useState(1);
  const [clubs] = useState([
    { name: "Driver", carry: 260, total: 290 },
    { name: "3-wood", carry: 240, total: 265 },
    { name: "5-wood", carry: 220, total: 240 },
    { name: "3-iron", carry: 200, total: 220 },
    { name: "4-iron", carry: 190, total: 205 },
    { name: "5-iron", carry: 180, total: 192 },
    { name: "6-iron", carry: 170, total: 180 },
    { name: "7-iron", carry: 160, total: 168 },
    { name: "8-iron", carry: 150, total: 156 },
    { name: "9-iron", carry: 140, total: 145 },
    { name: "PW", carry: 130, total: 134 },
    { name: "AW", carry: 110, total: 113 },
    { name: "SW", carry: 90, total: 92 }
  ]);

  const handleShotPlan = (plan: any) => {
    console.log('Shot plan:', plan);
    // Here you would typically:
    // 1. Update the visualization
    // 2. Save the shot data
    // 3. Update stats
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <CourseViewer 
        courseId={parseInt(courseId)} 
        holeNumber={currentHole} 
      />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2">
          <ShotPlanner 
            clubs={clubs}
            onShotPlan={handleShotPlan}
          />
        </div>
        <div>
          <WeatherOverlay />
        </div>
      </div>
    </div>
  );
}