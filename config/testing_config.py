from config.env_config import EnvConfig

class TestConfig(EnvConfig):
    def __init__(self, environ=None):
        super().__init__(environ)
        self.DB_FILE = "stats-data/stats-test.db"
