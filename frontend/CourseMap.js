
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function CourseMap({ courseDetails, shotOverlay }) {
    useEffect(() => {
        // Any additional setup can go here
    }, [courseDetails, shotOverlay]);

    return (
        <MapContainer style={{ height: '500px', width: '100%' }} center={[40.7128, -74.0060]} zoom={13}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            {courseDetails && <GeoJSON data={courseDetails} />}
            {shotOverlay && <GeoJSON data={shotOverlay} />}
        </MapContainer>
    );
}

export default CourseMap;
