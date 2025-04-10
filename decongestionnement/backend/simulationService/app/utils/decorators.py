from functools import wraps
from flask import jsonify
import traceback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle_errors(f):
    """Decorator to handle errors and return JSON responses"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"Validation error: {str(e)}")
            return jsonify({"error": str(e)}), 400
        except FileNotFoundError as e:
            logger.warning(f"File not found: {str(e)}")
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            logger.error(f"Unexpected error: {traceback.format_exc()}")
            return jsonify({"error": "Internal server error"}), 500
    return wrapper

def validate_simulation_config(f):
    """Decorator to validate simulation configuration"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Add validation logic here
        return f(*args, **kwargs)
    return wrapper