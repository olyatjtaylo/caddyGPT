
import sqlite3

DB_PATH = 'golfers.db'

def setup_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create golfer_profiles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS golfer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create clubs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clubs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        club_name TEXT NOT NULL,
        carry INTEGER NOT NULL,
        run INTEGER NOT NULL,
        dispersion INTEGER NOT NULL
    )
    """)

    # Create courses table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    setup_database()


def add_shot_tracking_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create shot_tracking table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shot_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        golfer_id INTEGER NOT NULL,
        club_name TEXT NOT NULL,
        distance REAL NOT NULL,
        accuracy REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (golfer_id) REFERENCES golfer_profiles (id)
    )
    """)
    conn.commit()
    conn.close()

if __name__ == '__main__':
    setup_database()
    add_shot_tracking_table()
