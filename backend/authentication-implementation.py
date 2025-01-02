# auth/jwt_handler.py
from datetime import datetime, timedelta
import jwt
from functools import wraps
from flask import jsonify, request, current_app
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DELTA = timedelta(days=1)

def generate_token(user_id: int, email: str) -> str:
    """Generate a JWT token for a user."""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + JWT_EXPIRATION_DELTA,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token')

def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in headers
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            current_user = decode_token(token)
            return f(current_user, *args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
            
    return decorated

# auth/password_handler.py
import bcrypt
from typing import Tuple

def hash_password(password: str) -> bytes:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)

def verify_password(password: str, hashed_password: bytes) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

# auth/models.py
from database_setup import get_db_connection

class User:
    @staticmethod
    def create(email: str, password: str, name: str) -> Tuple[bool, str]:
        """Create a new user."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                return False, "User already exists"
            
            # Hash password and create user
            hashed_password = hash_password(password)
            cursor.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
                (email, hashed_password, name)
            )
            conn.commit()
            return True, "User created successfully"
        except Exception as e:
            conn.rollback()
            return False, str(e)
        finally:
            conn.close()
    
    @staticmethod
    def authenticate(email: str, password: str) -> Tuple[bool, dict]:
        """Authenticate a user."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "SELECT id, email, password_hash, name FROM users WHERE email = ?",
                (email,)
            )
            user = cursor.fetchone()
            
            if not user:
                return False, {"error": "User not found"}
            
            if not verify_password(password, user['password_hash']):
                return False, {"error": "Invalid password"}
            
            return True, {
                "user_id": user['id'],
                "email": user['email'],
                "name": user['name']
            }
        finally:
            conn.close()

# auth/routes.py
from flask import Blueprint, request, jsonify
from .models import User
from .jwt_handler import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    required_fields = ['email', 'password', 'name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    success, message = User.create(
        email=data['email'],
        password=data['password'],
        name=data['name']
    )
    
    if not success:
        return jsonify({'error': message}), 400
    
    return jsonify({'message': message}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not all(field in data for field in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400
    
    success, user_data = User.authenticate(
        email=data['email'],
        password=data['password']
    )
    
    if not success:
        return jsonify(user_data), 401
    
    # Generate token
    token = generate_token(user_data['user_id'], user_data['email'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': user_data['user_id'],
            'email': user_data['email'],
            'name': user_data['name']
        }
    }), 200

@auth_bp.route('/protected', methods=['GET'])
@token_required
def protected(current_user):
    return jsonify({'message': f'Hello {current_user["email"]}!'}), 200