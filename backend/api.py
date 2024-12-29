
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

# Fetch details for a specific course, including its holes
@app.route('/api/course/<int:course_id>', methods=['GET'])
def get_course_details(course_id):
    try:
        course_query = db.execute(f"SELECT id, name, location, par, yardage FROM courses WHERE id = {course_id}")
        course = course_query.fetchone()
        if not course:
            return jsonify({"error": "Course not found"}), 404

        holes_query = db.execute(f"SELECT hole_number, par, yardage, handicap FROM holes WHERE course_id = {course_id}")
        holes_list = [{"hole_number": row[0], "par": row[1], "yardage": row[2], "handicap": row[3]} for row in holes_query.fetchall()]

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

try:
    # Sample route
    @app.route('/api/sample', methods=['GET'])
    def sample_route():
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        # Process data...
        return jsonify({"message": "Success", "data": data}), 200
except Exception as e:
    app.logger.error(f"Error in API: {str(e)}")
    return jsonify({"error": "An internal error occurred"}), 500
