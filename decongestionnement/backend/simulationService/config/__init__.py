import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    SUMO_CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../app/static/sumo_files')
    API_URL = os.getenv('API_URL', 'http://127.0.0.1:5001/api/simulation-data')
    
class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    MONGO_URI = 'mongodb://localhost:27017/test_db'

class ProductionConfig(Config):
    pass