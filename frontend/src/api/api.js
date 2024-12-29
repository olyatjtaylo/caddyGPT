import axios from 'axios';

const API_BASE_URL = "http://localhost:5000";

// Fetch courses list
export const fetchCourses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/get_courses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching courses:", error);
        throw error;
    }
};

// Fetch golfer profile by email
export const fetchGolferProfile = async (email) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/get_profile`, {
            params: { email }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching golfer profile:", error);
        throw error;
    }
};

// Recommend shot based on golfer's data and conditions
export const recommendShot = async (golfer_id, target_distance, elevation_change, wind_speed) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/recommend_shot`, {
            golfer_id,
            target_distance,
            elevation_change,
            wind_speed
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching shot recommendation:", error);
        throw error;
    }
};

// Upload KML file for course
export const uploadKML = async (file) => {
    const formData = new FormData();
    formData.append("kml_file", file);

    try {
        const response = await axios.post(`${API_BASE_URL}/upload_kml`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading KML file:", error);
        throw error;
    }
};
