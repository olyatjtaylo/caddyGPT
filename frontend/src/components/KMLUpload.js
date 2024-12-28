
import React, { useState } from 'react';

function KMLUpload({ onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const response = await fetch('/upload_kml', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload KML file');
            }
            const result = await response.json();
            onUploadComplete(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input type="file" accept=".kml" onChange={handleFileUpload} />
            {uploading && <p>Uploading...</p>}
            {error && <p>Error: {error}</p>}
        </div>
    );
}

export default KMLUpload;
