
import React, { useState, useEffect } from 'react';

function CourseDropdown({ onCourseSelect }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchCourses() {
            try {
                const response = await fetch('/get_courses');
                if (!response.ok) {
                    throw new Error('Failed to fetch courses');
                }
                const data = await response.json();
                setCourses(data.courses);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        }
        fetchCourses();
    }, []);

    const handleCourseChange = (event) => {
        const selectedCourse = courses.find(course => course.name === event.target.value);
        onCourseSelect(selectedCourse);
    };

    if (loading) return <p>Loading courses...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <select onChange={handleCourseChange}>
            <option value="">Select a course</option>
            {courses.map(course => (
                <option key={course.id} value={course.name}>
                    {course.name} - {course.location}
                </option>
            ))}
        </select>
    );
}

export default CourseDropdown;
