import os
from config.dev_config import DevConfig
from config.env_config import EnvConfig
from config.test_config import TestConfig

dev_config = DevConfig()
test_config = TestConfig()

def getConfig() -> EnvConfig:
    is_test = os.environ.get("RUN_TESTS", False)

    if is_test:
        return test_config
    else:
        return dev_config