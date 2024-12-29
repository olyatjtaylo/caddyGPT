
# File: gpt_plugin_backend.py
from fastapi import FastAPI, Query
from pydantic import BaseModel
import sqlite3
from openai import ChatCompletion

# Initialize FastAPI app
app = FastAPI(title="Custom GPT Distance Plugin", description="GPT plugin for distance queries")

# Path to the SQLite database
DATABASE_PATH = 'optimized_data.db'

# GPT API setup (replace 'your-api-key' with your OpenAI API key)
GPT_API_KEY = "your-api-key"
ChatCompletion.api_key = GPT_API_KEY

class DistanceQuery(BaseModel):
    latitude: float
    longitude: float

@app.get("/closest-object/")
def get_closest_object(latitude: float, longitude: float):
    """
    Query the closest object to a given latitude and longitude.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # SQL query to find the closest object
    query = """
    SELECT Name, Latitude, Longitude, Course,
           ((Latitude - ?) * (Latitude - ?) + (Longitude - ?) * (Longitude - ?)) AS Distance
    FROM locations
    ORDER BY Distance ASC
    LIMIT 1;
    """
    cursor.execute(query, (latitude, latitude, longitude, longitude))
    result = cursor.fetchone()
    conn.close()

    if not result:
        return {"error": "No objects found in the database."}

    name, obj_lat, obj_lon, course, distance = result

    # Construct GPT prompt
    prompt = (
        f"The closest object to latitude {latitude} and longitude {longitude} is "
        f"{name} located at {obj_lat}, {obj_lon} on course {course}. "
        f"The approximate distance is {distance:.2f} units."
    )

    # Query GPT
    response = ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}]
    )

    return {"result": response['choices'][0]['message']['content']}

@app.get("/plugin-manifest/")
def get_plugin_manifest():
    """
    Returns the AI plugin manifest required for GPT Marketplace integration.
    """
    manifest = {
        "schema_version": "v1",
        "name_for_human": "Distance Finder GPT Plugin",
        "name_for_model": "distance_finder_plugin",
        "description_for_human": "Finds the closest objects and calculates distances.",
        "description_for_model": "Provides data about the closest objects based on latitude and longitude.",
        "auth": {"type": "none"},
        "api": {"type": "openapi", "url": "/openapi.json"},
        "logo_url": "https://example.com/logo.png",  # Replace with hosted logo URL
        "contact_email": "your-email@example.com",
        "legal_info_url": "https://example.com/legal"  # Replace with actual legal info
    }
    return manifest
