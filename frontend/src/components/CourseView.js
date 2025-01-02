
import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import './CourseView.css';

mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

const CourseView = () => {
    const [map, setMap] = useState(null);
    const [currentHole, setCurrentHole] = useState(1);

    useEffect(() => {
        const initializeMap = () => {
            const mapInstance = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/satellite-v9',
                center: [-85.724793, 35.052792],
                zoom: 16,
            });
            mapInstance.addControl(new mapboxgl.NavigationControl());
            setMap(mapInstance);
        };

        if (!map) {
            initializeMap();
        }
    }, [map]);

    const switchHole = (hole) => {
        setCurrentHole(hole);
    };

    return (
        <section className="course-view">
            <div className="course-controls">
                <div className="hole-nav">
                    <button onClick={() => switchHole(currentHole - 1)} disabled={currentHole === 1}>
                        ←
                    </button>
                    <select
                        value={currentHole}
                        onChange={(e) => switchHole(Number(e.target.value))}
                    >
                        {[...Array(9)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                Hole {i + 1}
                            </option>
                        ))}
                    </select>
                    <button onClick={() => switchHole(currentHole + 1)} disabled={currentHole === 9}>
                        →
                    </button>
                </div>
            </div>
            <div id="map" className="map-container"></div>
        </section>
    );
};

export default CourseView;
