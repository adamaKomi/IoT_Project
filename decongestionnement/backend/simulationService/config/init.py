from .settings import Config, DevelopmentConfig, TestingConfig, ProductionConfig

# Function to choose the right configuration
def get_config(config_name):
    config_dict = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig,
        'default': DevelopmentConfig
    }
    return config_dict.get(config_name, config_dict['default'])