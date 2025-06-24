from app import create_app
from config.settings import ProductionConfig

app = create_app(ProductionConfig)

if __name__ == "__main__":
    # print("App :", app.config)
    app.run(host="0.0.0.0", port=3600)