from flask import Flask
from config.settings import Config
from flask_cors import CORS

def create_app(config_class=Config):
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(config_class)
    
    # Initialize extensions
    from .extensions import mongo
    mongo.init_app(app)
    
    # Initialize services
    from .services.simulation import SimulationService
    app.simulation_service = SimulationService(app.config)
    # print("Simulation service initialized with config:", app.config)
    
    # Register blueprints
    from .routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    
    return app

if __name__ == "__main__":
    app = create_app()