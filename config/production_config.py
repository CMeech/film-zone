from config.env_config import DEVELOPMENT_SECRET_KEY, ConfigError, EnvConfig, get_required


class ProductionConfig(EnvConfig):
    IS_PRODUCTION = True

    def __init__(self, environ=None):
        super().__init__(environ)
        self.FLASK_SECRET_KEY = get_required("FLASK_SECRET_KEY", self._environ)
        if self.FLASK_SECRET_KEY == DEVELOPMENT_SECRET_KEY:
            raise ConfigError(
                "FLASK_SECRET_KEY must not use the known development default in production"
            )
