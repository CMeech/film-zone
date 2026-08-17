from unittest.mock import Mock

import pytest
from flask import Flask

from config.env_config import ConfigError, EnvConfig
from config.production_config import ProductionConfig
from libs.cache import cache as cache_module


def test_redis_component_configuration_includes_password(monkeypatch):
    config = EnvConfig(
        {
            "CACHE_TYPE": "RedisCache",
            "CACHE_REDIS_HOST": "redis.internal",
            "CACHE_REDIS_PORT": "6380",
            "CACHE_REDIS_DB": "3",
            "CACHE_REDIS_PASSWORD": "private-password",
        }
    )
    extension = Mock()
    monkeypatch.setattr(cache_module, "cache", extension)
    app = Flask(__name__)

    cache_module.init_cache(app, config)

    assert app.config["CACHE_REDIS_HOST"] == "redis.internal"
    assert app.config["CACHE_REDIS_PORT"] == 6380
    assert app.config["CACHE_REDIS_DB"] == 3
    assert app.config["CACHE_REDIS_PASSWORD"] == "private-password"
    extension.init_app.assert_called_once_with(app)


def test_redis_url_takes_precedence_over_component_configuration(monkeypatch):
    redis_url = "rediss://user:password@redis.example:6380/4"
    config = EnvConfig(
        {
            "CACHE_TYPE": "RedisCache",
            "CACHE_REDIS_URL": redis_url,
            "CACHE_REDIS_HOST": "ignored-host",
            "CACHE_REDIS_PASSWORD": "ignored-password",
        }
    )
    extension = Mock()
    monkeypatch.setattr(cache_module, "cache", extension)
    app = Flask(__name__)

    cache_module.init_cache(app, config)

    assert app.config["CACHE_REDIS_URL"] == redis_url
    assert "CACHE_REDIS_HOST" not in app.config
    assert "CACHE_REDIS_PASSWORD" not in app.config


@pytest.mark.parametrize(
    "environment, message",
    [
        ({"CACHE_REDIS_URL": "http://redis.example"}, "CACHE_REDIS_URL"),
        ({"CACHE_REDIS_PORT": "70000"}, "CACHE_REDIS_PORT"),
        ({"CACHE_REDIS_DB": "-1"}, "CACHE_REDIS_DB"),
    ],
)
def test_invalid_redis_configuration_is_rejected(environment, message):
    config = EnvConfig({"CACHE_TYPE": "RedisCache", **environment})

    with pytest.raises(ConfigError, match=message):
        cache_module.init_cache(Flask(__name__), config)


def test_development_simple_cache_does_not_check_redis(monkeypatch):
    extension = Mock()
    monkeypatch.setattr(cache_module, "cache", extension)
    config = EnvConfig({})
    app = Flask(__name__)

    cache_module.init_cache(app, config)

    assert app.config["CACHE_TYPE"] == "SimpleCache"
    extension.init_app.assert_called_once_with(app)
    extension.cache._read_client.ping.assert_not_called()


def test_production_redis_connectivity_failure_is_clear(monkeypatch):
    extension = Mock()
    extension.cache._read_client.ping.side_effect = ConnectionError("refused")
    monkeypatch.setattr(cache_module, "cache", extension)
    config = ProductionConfig(
        {
            "FLASK_SECRET_KEY": "private-production-secret",
            "CACHE_TYPE": "RedisCache",
            "CACHE_REDIS_URL": "redis://redis.example:6379/0",
        }
    )

    with pytest.raises(RuntimeError, match="could not connect"):
        cache_module.init_cache(Flask(__name__), config)


def test_production_redis_connectivity_is_checked(monkeypatch):
    extension = Mock()
    monkeypatch.setattr(cache_module, "cache", extension)
    config = ProductionConfig(
        {
            "FLASK_SECRET_KEY": "private-production-secret",
            "CACHE_TYPE": "RedisCache",
            "CACHE_REDIS_PASSWORD": "private-password",
        }
    )

    cache_module.init_cache(Flask(__name__), config)

    extension.cache._read_client.ping.assert_called_once_with()
