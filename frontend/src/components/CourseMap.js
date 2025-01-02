
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'your_mapbox_access_token_here'; // Replace with a valid Mapbox token

function CourseMap() {
    const mapContainer = useRef(null);
    const map = useRef(null);

    useEffect(() => {
        if (map.current) return; // Initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-v9',
            center: [-85.724793, 35.052792],
            zoom: 16,
        });

        map.current.addControl(new mapboxgl.NavigationControl());
    }, []);

    return <div ref={mapContainer} style={{ height: '500px', width: '100%' }} />;
}

export default CourseMap;
