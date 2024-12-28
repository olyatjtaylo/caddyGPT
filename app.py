from flask import Flask, request, jsonify, send_from_directory
import os, sqlite3

app = Flask(__name__)
DB_PATH = 'golfers.db'

app = Flask(__name__)

# Route for favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/')
def home():
    return "Welcome to CaddyGPT!"

if __name__ == "__main__":
    app.run(debug=True)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/create_profile', methods=['POST'])
def create_profile():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    clubs = data.get("clubs", [])

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert golfer profile
        cursor.execute("INSERT INTO golfer_profiles (name, email) VALUES (?, ?)", (name, email))
        golfer_id = cursor.lastrowid

        # Insert clubs
        for club in clubs:
            cursor.execute(
                """
                INSERT INTO clubs (golfer_id, club_name, carry_distance, rollout_distance, dispersion_radius)
                VALUES (?, ?, ?, ?, ?)
                """,
                (golfer_id, club['club_name'], club['carry_distance'], club['rollout_distance'], club['dispersion_radius'])
            )

        conn.commit()
        return jsonify({"message": "Profile created successfully", "golfer_id": golfer_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400
    finally:
        conn.close()

@app.route('/update_profile', methods=['PUT'])
def update_profile():
    data = request.json
    email = data.get("email")
    clubs = data.get("clubs", [])

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get golfer ID
        cursor.execute("SELECT id FROM golfer_profiles WHERE email = ?", (email,))
        golfer = cursor.fetchone()
        if not golfer:
            return jsonify({"error": "Golfer profile not found"}), 404

        golfer_id = golfer['id']

        # Delete existing clubs
        cursor.execute("DELETE FROM clubs WHERE golfer_id = ?", (golfer_id,))

        # Insert updated clubs
        for club in clubs:
            cursor.execute(
                """
                INSERT INTO clubs (golfer_id, club_name, carry_distance, rollout_distance, dispersion_radius)
                VALUES (?, ?, ?, ?, ?)
                """,
                (golfer_id, club['club_name'], club['carry_distance'], club['rollout_distance'], club['dispersion_radius'])
            )

        conn.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
    finally:
        conn.close()

@app.route('/get_profile', methods=['GET'])
def get_profile():
    email = request.args.get("email")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get golfer profile
        cursor.execute("SELECT * FROM golfer_profiles WHERE email = ?", (email,))
        golfer = cursor.fetchone()
        if not golfer:
            return jsonify({"error": "Golfer profile not found"}), 404

        # Get clubs
        cursor.execute("SELECT * FROM clubs WHERE golfer_id = ?", (golfer['id'],))
        clubs = cursor.fetchall()

        return jsonify({
            "golfer": dict(golfer),
            "clubs": [dict(club) for club in clubs]
        }), 200
    finally:
        conn.close()

@app.route('/recommend_shot', methods=['POST'])
def recommend_shot():
    data = request.json
    golfer_id = data.get("golfer_id")
    target_distance = data.get("target_distance")
    elevation_change = data.get("elevation_change", 0)
    wind_speed = data.get("wind_speed", 0)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get golfer's club data
        cursor.execute("SELECT * FROM clubs WHERE golfer_id = ?", (golfer_id,))
        clubs = cursor.fetchall()

        # Calculate adjusted distance
        elevation_adjustment = elevation_change * 0.3
        wind_adjustment = wind_speed * 0.5
        adjusted_distance = target_distance + elevation_adjustment - wind_adjustment

        # Find best club
        best_club = None
        min_diff = float('inf')
        for club in clubs:
            carry_distance = club['carry_distance']
            diff = abs(carry_distance - adjusted_distance)
            if diff < min_diff:
                best_club = club
                min_diff = diff

        return jsonify({
            "recommended_club": best_club['club_name'],
            "carry_distance": best_club['carry_distance'],
            "rollout_distance": best_club['rollout_distance'],
            "dispersion_radius": best_club['dispersion_radius']
        }), 200
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)


# Import necessary functions from functional.py
from functional import get_courses_from_db, handle_kml_upload

@app.route('/get_courses', methods=['GET'])
def get_courses():
    try:
        # Simplified test: Return static data
        test_data = [
            {"name": "Test Course 1", "location": "Location A"},
            {"name": "Test Course 2", "location": "Location B"},
            {"name": "Test Course 3", "location": "Location C"}
        ]
        return jsonify({"success": True, "courses": test_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
def get_courses():
    try:
        # Query the database for available courses
        courses = get_courses_from_db("SELECT * FROM courses")
        return jsonify({"success": True, "courses": courses})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/upload_kml', methods=['POST'])
def upload_kml():
    if 'kml_file' not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400

    kml_file = request.files['kml_file']
    if kml_file.filename == '':
        return jsonify({"success": False, "error": "Empty file name"}), 400

    try:
        # Use the handle_kml_upload function to process the file
        result = handle_kml_upload(kml_file)
        return jsonify({"success": True, "message": "KML file uploaded successfully", "details": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/get_clubs', methods=['GET'])
def get_clubs():
    try:
        # Query the database for clubs (example query)
        connection = get_db_connection()
        clubs = connection.execute("SELECT * FROM clubs").fetchall()
        connection.close()

        # Format the response
        clubs_list = [{"club_name": club["club_name"], "carry": club["carry"], "run": club["run"], "dispersion": club["dispersion"]} for club in clubs]
        return jsonify({"success": True, "clubs": clubs_list})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500



import logging

# Configure logging to write debug information to a file
logging.basicConfig(filename='debug_recommend_shot.log', level=logging.DEBUG, format='%(asctime)s - %(message)s')

@app.route('/recommend_shot', methods=['POST'])
def recommend_shot_endpoint():
    try:
        # Parse input JSON data
        input_data = request.get_json()
        logging.debug("Input Data Received: %s", input_data)

        golfer_profile = input_data["golfer_profile"]
        course_details = input_data["course_details"]
        lat = course_details["latitude"]
        lon = course_details["longitude"]
        logging.debug("Parsed Golfer Profile: %s", golfer_profile)
        logging.debug("Parsed Course Details: %s", course_details)

        # Fetch weather data
        weather = get_weather(lat, lon)
        logging.debug("Weather Data Fetched: %s", weather)

        if "error" in weather:
            error_msg = "Failed to fetch weather data: " + weather["error"]
            logging.debug("Error: %s", error_msg)
            return jsonify({"success": False, "error": error_msg}), 500

        # Get shot recommendation using enhanced logic
        recommendation = recommend_shot(golfer_profile, weather, course_details)
        logging.debug("Shot Recommendation: %s", recommendation)

        if "error" in recommendation:
            logging.debug("Recommendation Error: %s", recommendation["error"])
            return jsonify({"success": False, "error": recommendation["error"]}), 400

        return jsonify(recommendation)
    except Exception as e:
        logging.debug("Exception Occurred: %s", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/track_shot', methods=['POST'])
def track_shot():
    data = request.json
    golfer_id = data.get("golfer_id")
    shot_data = data.get("shot_data", {})

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert the shot tracking data
        cursor.execute(
            """
            INSERT INTO shot_tracking (golfer_id, club_name, distance, accuracy, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """,
            (golfer_id, shot_data['club_name'], shot_data['distance'], shot_data['accuracy'], shot_data['timestamp'])
        )

        conn.commit()
        return jsonify({"message": "Shot tracked successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/get_shot_history', methods=['GET'])
def get_shot_history():
    golfer_id = request.args.get("golfer_id")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch shot history
        cursor.execute("SELECT * FROM shot_tracking WHERE golfer_id = ?", (golfer_id,))
        shots = cursor.fetchall()

        return jsonify({"shots": [dict(shot) for shot in shots]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
