
// frontend/src/components/CourseDetailCompletion.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CourseDetailCompletion = ({ courseId }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await axios.get(`/api/course/${courseId}`);
        setCourse(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [courseId]);

  if (loading) return <p>Loading course details...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>{course.name}</h1>
      <p>Location: {course.location}</p>
      <p>Par: {course.par}</p>
      <p>Yardage: {course.yardage}</p>
      <h2>Holes</h2>
      <ul>
        {course.holes.map((hole, index) => (
          <li key={index}>
            Hole {hole.hole_number}: Par {hole.par}, Yardage {hole.yardage}, Handicap {hole.handicap}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseDetailCompletion;
