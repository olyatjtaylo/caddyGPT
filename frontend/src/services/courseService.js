import { fetchCourses, uploadKML } from '../api/api';

const loadCourses = async () => {
    try {
        const courses = await fetchCourses();
        return courses;
    } catch (error) {
        console.error("Error loading courses:", error);
        throw error;
    }
};

const uploadCourseKML = async (file) => {
    try {
        const response = await uploadKML(file);
        return response;
    } catch (error) {
        console.error("Error uploading course KML:", error);
        throw error;
    }
};

export { loadCourses, uploadCourseKML };
