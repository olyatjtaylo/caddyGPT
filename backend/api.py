
from flask import Flask, jsonify, request
from database_connection import db, courses, holes

app = Flask(__name__)

# List all golf courses with latitude and longitude for map plotting
@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        query = db.execute("SELECT id, name, location, latitude, longitude, par, yardage FROM courses")
        courses_list = [
            {
                "id": row[0],
                "name": row[1],
                "location": row[2],
                "latitude": row[3],
                "longitude": row[4],
                "par": row[5],
                "yardage": row[6],
            }
            for row in query.fetchall()
        ]
        return jsonify(courses_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Fetch details for a specific course, including its holes
@app.route('/api/course/<int:course_id>', methods=['GET'])
def get_course_details(course_id):
    try:
        course_query = db.execute(
            f"SELECT id, name, location, par, yardage FROM courses WHERE id = {course_id}"
        )
        course = course_query.fetchone()
        if not course:
            return jsonify({"error": "Course not found"}), 404

        holes_query = db.execute(
            f"SELECT hole_number, par, yardage, handicap FROM holes WHERE course_id = {course_id}"
        )
        holes_list = [
            {
                "hole_number": row[0],
                "par": row[1],
                "yardage": row[2],
                "handicap": row[3],
            }
            for row in holes_query.fetchall()
        ]

        course_details = {
            "id": course[0],
            "name": course[1],
            "location": course[2],
            "par": course[3],
            "yardage": course[4],
            "holes": holes_list,
        }
        return jsonify(course_details), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Retrieve user clubs for "My Profile"
@app.route('/get_clubs', methods=['GET'])
def get_clubs():
    try:
        query = db.execute("SELECT id, name, carry, run, dispersion FROM clubs")
        clubs_list = [
            {
                "id": row[0],
                "name": row[1],
                "carry": row[2],
                "run": row[3],
                "dispersion": row[4],
            }
            for row in query.fetchall()
        ]
        return jsonify({"clubs": clubs_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update user clubs from "My Profile"
@app.route('/update_clubs', methods=['POST'])
def update_clubs():
    try:
        clubs = request.json.get("clubs", [])
        db.execute("DELETE FROM clubs")  # Clear existing clubs (simplified for example)
        for club in clubs:
            db.execute(
                "INSERT INTO clubs (name, carry, run, dispersion) VALUES (?, ?, ?, ?)",
                (club["name"], club["carry"], club["run"], club["dispersion"]),
            )
        db.commit()
        return jsonify({"message": "Clubs updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
