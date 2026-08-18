from config.env_config import EnvConfig, get_string

class TestConfig(EnvConfig):
    def __init__(self, environ=None):
        super().__init__(environ)
        self.DB_FILE = get_string(
            "DB_FILE", "stats-data/stats-test.db", self._environ
        )
