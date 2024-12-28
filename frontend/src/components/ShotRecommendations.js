
import React, { useState } from 'react';

function ShotRecommendations() {
    const [targetDistance, setTargetDistance] = useState('');
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/recommend_shot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    golfer_profile: {
                        avg_distances: {
                            Driver: 250,
                            "3 Wood": 230,
                            "5 Iron": 200
                        },
                        dispersion: {
                            Driver: 10,
                            "3 Wood": 8,
                            "5 Iron": 6
                        }
                    },
                    course_details: {
                        target_distance: parseFloat(targetDistance),
                        latitude: 40.7128,
                        longitude: -74.0060
                    }
                })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch shot recommendation');
            }
            const data = await response.json();
            setRecommendation(data.recommendation || data.alternative);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>AI Shot Recommendations</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Target Distance (yards):
                    <input
                        type="number"
                        value={targetDistance}
                        onChange={(e) => setTargetDistance(e.target.value)}
                        required
                    />
                </label>
                <button type="submit">Get Recommendation</button>
            </form>
            {error && <p>Error: {error}</p>}
            {recommendation && (
                <div>
                    <h2>Recommendation:</h2>
                    <p><strong>Club:</strong> {recommendation.club || recommendation.closest_club}</p>
                    <p><strong>Carry:</strong> {recommendation.carry || recommendation.adjusted_carry} yards</p>
                    {recommendation.suggestion && <p>{recommendation.suggestion}</p>}
                </div>
            )}
        </div>
    );
}

export default ShotRecommendations;
