
import logging
import os

# Ensure the log file is created in the backend directory
LOG_FILE_PATH = os.path.join(os.path.dirname(__file__), 'backend_debug.log')

logging.basicConfig(filename=LOG_FILE_PATH, level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
import sqlite3
from kml_parser.kml_parser import parse_kml

DATABASE = 'golfers.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_courses_from_db(query):
    conn = get_db_connection()
    courses = conn.execute("SELECT * FROM courses WHERE name LIKE ?", ('%' + query + '%',)).fetchall()
    conn.close()

    # Log the raw data fetched from the database
    logging.debug("Raw courses data: %s", courses)

    # Convert rows to dictionaries for JSON compatibility
    try:
        courses_list = [{"name": course["name"], "location": course["location"]} for course in courses]
        logging.debug("Converted courses list: %s", courses_list)
        return courses_list
    except Exception as e:
        logging.error("Error converting courses data: %s", str(e))
        raise
def handle_kml_upload(file):
    parsed_data = parse_kml(file)
    if parsed_data:
        # Here, insert the parsed data into your database (mock insert for now)
        conn = get_db_connection()
        for course in parsed_data:
            conn.execute("INSERT INTO courses (name) VALUES (?)", (course['name'],))
        conn.commit()
        conn.close()
        return {"message": "KML file processed successfully"}
    else:
        return {"message": "Error processing KML file"}



import requests

def get_weather(lat, lon, api_key='YOUR_API_KEY'):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
        response = requests.get(url)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx and 5xx)
        data = response.json()
        # Extract relevant weather details
        weather_info = {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"],
            "wind_direction": data["wind"]["deg"],
            "condition": data["weather"][0]["description"],
        }
        return weather_info
    except Exception as e:
        return {"error": str(e)}



def recommend_shot(golfer_profile, weather, course_details):
    try:
        # Extract golfer stats
        avg_distances = golfer_profile["avg_distances"]  # Dict with club names and average distances
        dispersion = golfer_profile["dispersion"]       # Dict with club dispersion values

        # Extract weather data
        wind_speed = weather["wind_speed"]
        wind_direction = weather["wind_direction"]
        temperature = weather["temperature"]

        # Extract course details
        target_distance = course_details["target_distance"]
        wind_factor = wind_speed * 0.1  # Simplified adjustment for wind

        # Determine recommended club
        best_club = None
        closest_club = None
        closest_distance_diff = float("inf")
        for club, distance in avg_distances.items():
            adjusted_distance = distance + wind_factor  # Adjust for wind
            distance_diff = abs(adjusted_distance - target_distance)
            
            if adjusted_distance >= target_distance and distance_diff < dispersion[club]:
                best_club = club
                break
            elif distance_diff < closest_distance_diff:  # Track the closest club as a fallback
                closest_club = club
                closest_distance_diff = distance_diff

        # Construct the response
        if best_club:
            # Predicted shot outcome (simplified)
            predicted_outcome = {
                "club": best_club,
                "carry": avg_distances[best_club],
                "adjusted_carry": avg_distances[best_club] + wind_factor,
                "dispersion": dispersion[best_club],
                "wind_factor": wind_factor,
                "temperature_adjustment": temperature * 0.05  # Example: adjustment based on temp
            }
            return {"success": True, "recommendation": predicted_outcome}
        else:
            alternative_suggestion = {
                "closest_club": closest_club,
                "adjusted_carry": avg_distances[closest_club] + wind_factor,
                "distance_diff": closest_distance_diff,
                "suggestion": f"Use {closest_club} for the closest possible shot, and plan for additional shots."
            }
            return {"success": False, "alternative": alternative_suggestion}
    except Exception as e:
        return {"error": str(e)}
