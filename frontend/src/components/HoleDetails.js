
// frontend/src/components/HoleDetails.js
import React, { useState, useEffect } from 'react';

const HoleDetails = ({ courseId }) => {
  const [holeDetails, setHoleDetails] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHoleDetails = async () => {
      try {
        const response = await fetch(`/api/course/${courseId}`);
        if (!response.ok) {
          throw new Error(`Error fetching hole details: ${response.statusText}`);
        }
        const data = await response.json();
        setHoleDetails(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchHoleDetails();
  }, [courseId]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!holeDetails.length) {
    return <p>Loading hole details...</p>;
  }

  return (
    <div className="yardage-book">
      <h2>Yardage Book</h2>
      <ul>
        {holeDetails.map((hole) => (
          <li key={hole.id}>
            <span>Hole {hole.hole_number}:</span>
            <span>Par {hole.par}, {hole.yardage} yards</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HoleDetails;
