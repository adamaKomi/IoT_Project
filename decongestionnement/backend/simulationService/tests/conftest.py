import pytest
from app import create_app
from config.settings import TestingConfig
from ..extensions import mongo

@pytest.fixture
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        mongo.db.drop_collection('traffic_data')
        yield app

@pytest.fixture
def client(app):
    return app.test_client()