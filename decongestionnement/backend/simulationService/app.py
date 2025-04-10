from app import create_app
from config.settings import ProductionConfig

app = create_app(ProductionConfig)

if __name__ == "__main__":
    app.run()