from .settings import Config
import os

class ProductionConfig(Config):
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongo:27017/')
    SUMO_CONFIG_PATH = '/app/sumo_files'  # For Docker container
    API_URL = os.getenv('API_URL', 'http://api-service:5001/api/simulation-data')
    
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        # Production-specific initialization
        app.config['MONGO_CONNECT'] = False  # For better connection handling