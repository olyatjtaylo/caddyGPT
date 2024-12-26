
# backend/app.py
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
import sqlite3
import math

app = FastAPI()

DB_PATH = "optimized_data.db"

class ClosestObjectResponse(BaseModel):
    course_name: str
    pin_type: str
    distance_to_pin: float
    latitude: float
    longitude: float

@app.get("/closest-object/", response_model=ClosestObjectResponse)
def get_closest_object(latitude: float = Query(...), longitude: float = Query(...)):
    """
    Finds the closest object (e.g., pin) in the database to the provided latitude and longitude.
    """
    try:
        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # SQL query to find the closest pin
        query = """
        SELECT course_name, pin_type, latitude, longitude,
               ((latitude - ?) * (latitude - ?) + (longitude - ?) * (longitude - ?)) AS distance
        FROM locations
        ORDER BY distance ASC
        LIMIT 1;
        """
        cursor.execute(query, (latitude, latitude, longitude, longitude))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="No objects found in the database.")

        # Extract result fields
        course_name, pin_type, lat, lon, distance = result
        distance_to_pin = math.sqrt(distance) * 111139  # Convert to meters (approx)

        # Return the closest object
        return ClosestObjectResponse(
            course_name=course_name,
            pin_type=pin_type,
            distance_to_pin=distance_to_pin,
            latitude=lat,
            longitude=lon
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    finally:
        conn.close()
