# validation/schemas.py
from marshmallow import Schema, fields, validates, ValidationError
from typing import Optional
import re

class GolferProfileSchema(Schema):
    """Validation schema for golfer profile data."""
    name = fields.Str(required=True)
    email = fields.Email(required=True)
    handicap = fields.Float(allow_none=True)
    clubs = fields.List(fields.Dict(), required=True)
    
    @validates('name')
    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise ValidationError('Name must be at least 2 characters long')

class ClubSchema(Schema):
    """Validation schema for golf club data."""
    club_name = fields.Str(required=True)
    carry_distance = fields.Float(required=True)
    rollout_distance = fields.Float(required=True)
    dispersion_radius = fields.Float(required=True)
    
    @validates('carry_distance')
    def validate_carry_distance(self, value):
        if value < 0 or value > 400:
            raise ValidationError('Invalid carry distance')

class ShotRecommendationSchema(Schema):
    """Validation schema for shot recommendations."""
    golfer_id = fields.Int(required=True)
    target_distance = fields.Float(required=True)
    elevation_change = fields.Float(missing=0)
    wind_speed = fields.Float(missing=0)
    wind_direction = fields.Float(missing=0)

# services/caching.py
from functools import wraps
from typing import Optional, Any, Callable
import redis
import json
import os
from datetime import timedelta

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=0,
    decode_responses=True
)

class CacheService:
    @staticmethod
    def cache_key(*args, **kwargs) -> str:
        """Generate a cache key from arguments."""
        key_parts = [str(arg) for arg in args]
        key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
        return ":".join(key_parts)

    @staticmethod
    def cache(ttl: int = 300) -> Callable:
        """Cache decorator with TTL in seconds."""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = CacheService.cache_key(func.__name__, *args, **kwargs)
                
                # Try to get from cache
                cached_value = redis_client.get(cache_key)
                if cached_value:
                    return json.loads(cached_value)
                
                # If not in cache, execute function
                result = await func(*args, **kwargs)
                
                # Cache the result
                redis_client.setex(
                    cache_key,
                    timedelta(seconds=ttl),
                    json.dumps(result)
                )
                
                return result
            return wrapper
        return decorator

    @staticmethod
    def invalidate_pattern(pattern: str) -> None:
        """Invalidate all keys matching pattern."""
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)

# services/error_handling.py
from typing import Dict, Any, Optional
from flask import jsonify
import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AppError(Exception):
    """Base application error class."""
    def __init__(self, message: str, status_code: int = 400, payload: Optional[Dict] = None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self) -> Dict[str, Any]:
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status_code'] = self.status_code
        return rv

class DataValidationError(AppError):
    """Raised when data validation fails."""
    def __init__(self, message: str, errors: Optional[Dict] = None):
        super().__init__(message, status_code=400)
        self.errors = errors

class DatabaseError(AppError):
    """Raised when database operations fail."""
    def __init__(self, message: str, original_error: Optional[Exception] = None):
        super().__init__(message, status_code=500)
        self.original_error = original_error

def setup_error_handlers(app):
    """Set up error handlers for the Flask app."""
    
    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        # Log the full error with traceback
        logger.error(f"Unexpected error: {str(error)}")
        logger.error(traceback.format_exc())
        
        # Return generic error to client
        response = jsonify({
            'message': 'An unexpected error occurred',
            'status_code': 500
        })
        response.status_code = 500
        return response

# services/database.py
from contextlib import contextmanager
from typing import Generator, Any
import sqlite3
from sqlite3 import Connection, Cursor
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self, db_path: str):
        self.db_path = db_path

    @contextmanager
    def get_connection(self) -> Generator[Connection, None, None]:
        """Create a database connection context."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            yield conn
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            raise DatabaseError("Failed to connect to database", e)
        finally:
            if conn:
                conn.close()

    def execute_query(self, query: str, params: tuple = ()) -> Any:
        """Execute a database query."""
        with self.get_connection() as conn:
            try:
                cursor = conn.cursor()
                cursor.execute(query, params)
                return cursor.fetchall()
            except Exception as e:
                logger.error(f"Query execution error: {str(e)}")
                raise DatabaseError("Failed to execute query", e)

    def execute_transaction(self, queries: list) -> None:
        """Execute multiple queries in a transaction."""
        with self.get_connection() as conn:
            try:
                cursor = conn.cursor()
                for query, params in queries:
                    cursor.execute(query, params)
                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Transaction error: {str(e)}")
                raise DatabaseError("Failed to execute transaction", e)

# services/shot_recommendation.py
from typing import Dict, Any, Optional
from .caching import CacheService
from validation.schemas import ShotRecommendationSchema
import math

class ShotRecommendationService:
    def __init__(self, db_service: DatabaseService):
        self.db = db_service
        self.validation_schema = ShotRecommendationSchema()

    @CacheService.cache(ttl=60)  # Cache for 1 minute
    async def recommend_shot(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate shot recommendations based on conditions."""
        # Validate input data
        errors = self.validation_schema.validate(data)
        if errors:
            raise DataValidationError("Invalid shot recommendation data", errors)

        try:
            # Get golfer's clubs
            clubs = self.db.execute_query(
                "SELECT * FROM clubs WHERE golfer_id = ?",
                (data['golfer_id'],)
            )

            if not clubs:
                raise DataValidationError("No clubs found for golfer")

            # Calculate adjusted distance based on conditions
            adjusted_distance = self._calculate_adjusted_distance(
                data['target_distance'],
                data.get('elevation_change', 0),
                data.get('wind_speed', 0),
                data.get('wind_direction', 0)
            )

            # Find best club
            recommended_club = self._find_best_club(clubs, adjusted_distance)

            return {
                'recommended_club': recommended_club['club_name'],
                'carry_distance': recommended_club['carry_distance'],
                'rollout_distance': recommended_club['rollout_distance'],
                'total_distance': recommended_club['carry_distance'] + recommended_club['rollout_distance'],
                'dispersion_radius': recommended_club['dispersion_radius'],
                'conditions': {
                    'elevation_effect': data.get('elevation_change', 0) * 0.1,
                    'wind_effect': data.get('wind_speed', 0) * 0.2
                }
            }

        except Exception as e:
            logger.error(f"Shot recommendation error: {str(e)}")
            raise DatabaseError("Failed to generate shot recommendation", e)

    def _calculate_adjusted_distance(
        self,
        target_distance: float,
        elevation_change: float,
        wind_speed: float,
        wind_direction: float
    ) -> float:
        """Calculate distance adjusted for conditions."""
        # Adjust for elevation (rough approximation)
        elevation_effect = elevation_change * 0.1
        
        # Adjust for wind (rough approximation)
        wind_effect = wind_speed * 0.2 * math.cos(math.radians(wind_direction))
        
        return target_distance - elevation_effect - wind_effect

    def _find_best_club(
        self,
        clubs: list,
        adjusted_distance: float
    ) -> Dict[str, Any]:
        """Find the best club for the adjusted distance."""
        best_club = None
        min_difference = float('inf')

        for club in clubs:
            total_distance = club['carry_distance'] + club['rollout_distance']
            difference = abs(total_distance - adjusted_distance)
            
            if difference < min_difference:
                min_difference = difference
                best_club = club

        return best_club