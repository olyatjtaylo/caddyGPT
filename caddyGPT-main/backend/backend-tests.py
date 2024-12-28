# tests/conftest.py
import pytest
import os
import tempfile
import sqlite3
from app import create_app
from database_setup import setup_database

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app({
        'TESTING': True,
        'DATABASE': db_path,
        'SECRET_KEY': 'test',
        'JWT_SECRET_KEY': 'test-jwt-key'
    })

    # Create the database and load test data
    with app.app_context():
        setup_database()
        _load_test_data(app)

    yield app

    # Cleanup after test
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """Get auth headers for protected endpoints."""
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    token = response.get_json()['token']
    return {'Authorization': f'Bearer {token}'}

def _load_test_data(app):
    """Load test data into the database."""
    with app.app_context():
        db = sqlite3.connect(app.config['DATABASE'])
        cursor = db.cursor()

        # Create test user
        cursor.execute("""
            INSERT INTO users (email, password_hash, name)
            VALUES (?, ?, ?)
        """, ('test@example.com', 'hashed_password', 'Test User'))

        # Create test golfer profile
        cursor.execute("""
            INSERT INTO golfer_profiles (user_id, name, email, handicap)
            VALUES (?, ?, ?, ?)
        """, (1, 'Test Golfer', 'test@example.com', 15.5))

        # Add test clubs
        test_clubs = [
            ('Driver', 250, 20, 15, 1),
            ('3 Wood', 230, 15, 12, 1),
            ('5 Iron', 180, 5, 8, 1),
            ('PW', 120, 3, 5, 1)
        ]
        cursor.executemany("""
            INSERT INTO clubs (club_name, carry_distance, rollout_distance, dispersion_radius, golfer_id)
            VALUES (?, ?, ?, ?, ?)
        """, test_clubs)

        db.commit()

# tests/test_auth.py
def test_register(client):
    """Test user registration."""
    response = client.post('/auth/register', json={
        'email': 'new@example.com',
        'password': 'password123',
        'name': 'New User'
    })
    assert response.status_code == 201
    assert 'message' in response.get_json()

def test_login(client):
    """Test user login."""
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'token' in json_data
    assert 'user' in json_data

def test_protected_route(client, auth_headers):
    """Test protected route access."""
    response = client.get('/protected', headers=auth_headers)
    assert response.status_code == 200

# tests/test_shot_recommendation.py
def test_shot_recommendation(client, auth_headers):
    """Test shot recommendation endpoint."""
    response = client.post('/recommend_shot', 
        headers=auth_headers,
        json={
            'target_distance': 150,
            'elevation_change': 5,
            'wind_speed': 10,
            'wind_direction': 45
        }
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'recommended_club' in data
    assert 'carry_distance' in data
    assert 'conditions' in data

def test_invalid_shot_recommendation(client, auth_headers):
    """Test shot recommendation with invalid data."""
    response = client.post('/recommend_shot',
        headers=auth_headers,
        json={
            'target_distance': -50,  # Invalid negative distance
            'elevation_change': 5
        }
    )
    assert response.status_code == 400
    assert 'error' in response.get_json()

# tests/test_database.py
from services.database import DatabaseService

def test_database_connection(app):
    """Test database connection and basic operations."""
    with app.app_context():
        db = DatabaseService(app.config['DATABASE'])
        
        # Test simple query
        result = db.execute_query("SELECT * FROM users WHERE email = ?", 
                                ('test@example.com',))
        assert len(result) == 1
        assert result[0]['email'] == 'test@example.com'

def test_database_transaction(app):
    """Test database transactions."""
    with app.app_context():
        db = DatabaseService(app.config['DATABASE'])
        
        # Test transaction with multiple queries
        queries = [
            ("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
             ('transaction@test.com', 'hash', 'Transaction Test')),
            ("INSERT INTO golfer_profiles (user_id, name, email) VALUES (?, ?, ?)",
             (1, 'Transaction Golfer', 'transaction@test.com'))
        ]
        
        db.execute_transaction(queries)
        
        # Verify transaction
        result = db.execute_query("SELECT * FROM users WHERE email = ?",
                                ('transaction@test.com',))
        assert len(result) == 1

# tests/test_validation.py
from validation.schemas import GolferProfileSchema, ClubSchema, ShotRecommendationSchema

def test_golfer_profile_validation():
    """Test golfer profile validation."""
    schema = GolferProfileSchema()
    
    # Test valid data
    valid_data = {
        'name': 'Test Golfer',
        'email': 'test@example.com',
        'handicap': 15.5,
        'clubs': [
            {
                'club_name': 'Driver',
                'carry_distance': 250
            }
        ]
    }
    errors = schema.validate(valid_data)
    assert not errors
    
    # Test invalid data
    invalid_data = {
        'name': '',  # Empty name
        'email': 'invalid-email',  # Invalid email
        'handicap': 'invalid',  # Invalid type
        'clubs': None  # Missing required field
    }
    errors = schema.validate(invalid_data)
    assert len(errors) > 0

def test_club_validation():
    """Test club data validation."""
    schema = ClubSchema()
    
    # Test valid data
    valid_data = {
        'club_name': 'Driver',
        'carry_distance': 250,
        'rollout_distance': 20,
        'dispersion_radius': 15
    }
    errors = schema.validate(valid_data)
    assert not errors
    
    # Test invalid data
    invalid_data = {
        'club_name': 'Driver',
        'carry_distance': -50,  # Invalid negative distance
        'rollout_distance': 'invalid',  # Invalid type
        'dispersion_radius': 1000  # Unrealistic value
    }
    errors = schema.validate(invalid_data)
    assert len(errors) > 0