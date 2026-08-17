import pytest

from config.config import getConfig
from config.env_config import DEVELOPMENT_SECRET_KEY, ConfigError, get_bool, get_int
from config.production_config import ProductionConfig
from config.testing_config import TestConfig as ApplicationTestConfig


@pytest.mark.parametrize("value", ["true", "TRUE", "1", "yes", "on"])
def test_get_bool_accepts_true_values(value):
    assert get_bool("SETTING", environ={"SETTING": value}) is True


@pytest.mark.parametrize("value", ["false", "FALSE", "0", "no", "off"])
def test_get_bool_accepts_false_values(value):
    assert get_bool("SETTING", environ={"SETTING": value}) is False


def test_get_bool_rejects_invalid_value():
    with pytest.raises(ConfigError, match="SETTING must be a boolean"):
        get_bool("SETTING", environ={"SETTING": "sometimes"})


def test_get_int_parses_integer():
    assert get_int("SETTING", environ={"SETTING": "6379"}) == 6379


def test_get_int_rejects_invalid_value():
    with pytest.raises(ConfigError, match="SETTING must be an integer"):
        get_int("SETTING", environ={"SETTING": "many"})


def test_configuration_values_have_expected_types():
    config = getConfig(
        {
            "SESSION_COOKIE_SECURE": "False",
            "CACHE_REDIS_PORT": "6380",
            "CACHE_REDIS_DB": "2",
            "CACHE_DEFAULT_TIMEOUT": "120",
            "PERMANENT_SESSION_LIFETIME": "7200",
            "MAX_BODY_SIZE": "100",
            "MAX_CONTENT_LENGTH": "200",
            "MAX_FORM_MEMORY_SIZE": "300",
        }
    )

    assert config.SESSION_COOKIE_SECURE is False
    assert config.CACHE_REDIS_PORT == 6380
    assert config.CACHE_REDIS_DB == 2
    assert config.CACHE_DEFAULT_TIMEOUT == 120
    assert config.PERMANENT_SESSION_LIFETIME == 7200
    assert config.MAX_BODY_SIZE == 100
    assert config.MAX_CONTENT_LENGTH == 200
    assert config.MAX_FORM_MEMORY_SIZE == 300
    assert all(
        isinstance(value, int)
        for value in (
            config.CACHE_REDIS_PORT,
            config.CACHE_REDIS_DB,
            config.CACHE_DEFAULT_TIMEOUT,
            config.PERMANENT_SESSION_LIFETIME,
            config.MAX_BODY_SIZE,
            config.MAX_CONTENT_LENGTH,
            config.MAX_FORM_MEMORY_SIZE,
        )
    )


@pytest.mark.parametrize("secret", [None, "", DEVELOPMENT_SECRET_KEY])
def test_production_requires_non_default_secret(secret):
    environ = {"FILMZONE_ENV": "production"}
    if secret is not None:
        environ["FLASK_SECRET_KEY"] = secret

    with pytest.raises(ConfigError, match="FLASK_SECRET_KEY"):
        getConfig(environ)


def test_production_accepts_private_secret():
    config = getConfig(
        {"FILMZONE_ENV": "production", "FLASK_SECRET_KEY": "a-private-secret"}
    )

    assert isinstance(config, ProductionConfig)
    assert config.FLASK_SECRET_KEY == "a-private-secret"


def test_tests_use_explicit_test_database_even_when_run_tests_is_false_string():
    development = getConfig({"RUN_TESTS": "false", "DB_FILE": "custom.db"})
    testing = getConfig({"RUN_TESTS": "true", "DB_FILE": "custom.db"})

    assert development.DB_FILE == "custom.db"
    assert isinstance(testing, ApplicationTestConfig)
    assert testing.DB_FILE == "stats-data/stats-test.db"


def test_unknown_application_environment_is_rejected():
    with pytest.raises(ConfigError, match="FILMZONE_ENV"):
        getConfig({"FILMZONE_ENV": "staging"})
