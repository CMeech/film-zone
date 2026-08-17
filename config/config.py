import os
from collections.abc import Mapping

from config.dev_config import DevConfig
from config.env_config import ConfigError, EnvConfig, get_bool, get_string
from config.production_config import ProductionConfig
from config.testing_config import TestConfig


def getConfig(environ: Mapping[str, str] | None = None) -> EnvConfig:
    source = os.environ if environ is None else environ

    if get_bool("RUN_TESTS", False, source):
        return TestConfig(source)

    environment = get_string("FILMZONE_ENV", "development", source).strip().lower()
    if environment == "production":
        return ProductionConfig(source)
    if environment == "development":
        return DevConfig(source)

    raise ConfigError(
        "FILMZONE_ENV must be either 'development' or 'production'; "
        f"got {environment!r}"
    )
