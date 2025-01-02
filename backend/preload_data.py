
# backend/preload_data.py
from database_connection import db

# Sample data for the 'courses' table
courses_data = [
    {"id": 1, "name": "Pebble Beach Golf Links", "location": "California, USA", "par": 72, "yardage": 6828},
    {"id": 2, "name": "St Andrews Links", "location": "Scotland, UK", "par": 72, "yardage": 7310}
]

# Sample data for the 'holes' table
holes_data = [
    {"course_id": 1, "hole_number": 1, "par": 4, "yardage": 377, "handicap": 12},
    {"course_id": 1, "hole_number": 2, "par": 5, "yardage": 502, "handicap": 8},
    {"course_id": 2, "hole_number": 1, "par": 4, "yardage": 376, "handicap": 10},
    {"course_id": 2, "hole_number": 2, "par": 4, "yardage": 453, "handicap": 4}
]

# Preload data into the 'courses' table
for course in courses_data:
    db.execute("INSERT INTO courses (id, name, location, par, yardage) VALUES (:id, :name, :location, :par, :yardage)",
               course)

# Preload data into the 'holes' table
for hole in holes_data:
    db.execute("INSERT INTO holes (course_id, hole_number, par, yardage, handicap) VALUES (:course_id, :hole_number, :par, :yardage, :handicap)",
               hole)

print("Data preloading completed.")
