
# backend/api.py
from flask import Flask, jsonify, request
from database_connection import db, courses, holes

app = Flask(__name__)

# List all golf courses
@app.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        query = db.execute("SELECT id, name, location, par, yardage FROM courses")
        courses_list = [{"id": row[0], "name": row[1], "location": row[2], "par": row[3], "yardage": row[4]} for row in query.fetchall()]
        return jsonify(courses_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Fetch hole details for a specific course by ID
@app.route('/api/course/<int:course_id>', methods=['GET'])
def get_hole_details(course_id):
    try:
        query = db.execute("SELECT id, hole_number, par, yardage FROM holes WHERE course_id = :course_id", {"course_id": course_id})
        hole_details = [{"id": row[0], "hole_number": row[1], "par": row[2], "yardage": row[3]} for row in query.fetchall()]
        
        if not hole_details:
            return jsonify({"message": "No holes found for the given course ID"}), 404
        
        return jsonify(hole_details), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
