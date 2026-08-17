from urllib.parse import urlsplit

from flask_caching import Cache

from config.config import getConfig
from config.env_config import ConfigError
from libs.logging.logging import logger

cache = Cache()


def _redis_settings(config):
    settings = {
        "CACHE_TYPE": "RedisCache",
        "CACHE_DEFAULT_TIMEOUT": config.CACHE_DEFAULT_TIMEOUT,
    }

    if config.CACHE_REDIS_URL:
        parsed_url = urlsplit(config.CACHE_REDIS_URL)
        if parsed_url.scheme not in {"redis", "rediss", "unix"}:
            raise ConfigError(
                "CACHE_REDIS_URL must use a redis://, rediss://, or unix:// URL"
            )
        if parsed_url.scheme in {"redis", "rediss"} and not parsed_url.hostname:
            raise ConfigError("CACHE_REDIS_URL must include a Redis hostname")
        if parsed_url.scheme == "unix" and not parsed_url.path:
            raise ConfigError("CACHE_REDIS_URL must include a Unix socket path")
        settings["CACHE_REDIS_URL"] = config.CACHE_REDIS_URL
        return settings

    if not config.CACHE_REDIS_HOST or not config.CACHE_REDIS_HOST.strip():
        raise ConfigError("CACHE_REDIS_HOST must not be empty")
    if not 1 <= config.CACHE_REDIS_PORT <= 65535:
        raise ConfigError("CACHE_REDIS_PORT must be between 1 and 65535")
    if config.CACHE_REDIS_DB < 0:
        raise ConfigError("CACHE_REDIS_DB must be zero or greater")

    settings.update(
        {
            "CACHE_REDIS_HOST": config.CACHE_REDIS_HOST,
            "CACHE_REDIS_PORT": config.CACHE_REDIS_PORT,
            "CACHE_REDIS_DB": config.CACHE_REDIS_DB,
        }
    )
    if config.CACHE_REDIS_PASSWORD is not None:
        settings["CACHE_REDIS_PASSWORD"] = config.CACHE_REDIS_PASSWORD
    return settings


def _validate_redis_connection():
    try:
        cache.cache._read_client.ping()
    except Exception as error:
        raise RuntimeError(
            "Redis cache is configured but FilmZone could not connect during "
            "production startup; check CACHE_REDIS_URL or the CACHE_REDIS_* settings"
        ) from error


def init_cache(app, config=None):
    config = getConfig() if config is None else config
    if config.CACHE_TYPE.lower() == "rediscache":
        logger.debug("Using RedisCache")
        app.config.update(_redis_settings(config))
    else:
        app.config['CACHE_TYPE'] = config.CACHE_TYPE
        app.config['CACHE_DEFAULT_TIMEOUT'] = config.CACHE_DEFAULT_TIMEOUT

    cache.init_app(app)
    if config.IS_PRODUCTION and config.CACHE_TYPE.lower() == "rediscache":
        _validate_redis_connection()

def add_to_cache(key, value, timeout):
    """
    Add a value to the cache for a specified time and key.

    Args:
        key (str): The cache key.
        value (any): The value to cache.
        timeout (int): The time in seconds to cache the value.

    Returns:
        None
    """
    logger.debug(f"Adding {key} to cache with timeout {timeout}")
    cache.set(key, value, timeout=timeout)

def remove_from_cache(key):
    """
    Remove a key from the cache.

    Args:
        key (str): The cache key to remove.

    Returns:
        None
    """
    logger.debug(f"Removing {key} from cache")
    cache.delete(key)

def key_exists(key):
    """
    Check if a key exists in the cache.

    Args:
        key (str): The cache key to check.

    Returns:
        bool: True if the key exists, False otherwise.
    """
    logger.debug(f"Checking if {key} exists in cache")
    return cache.get(key) is not None

def get_value(key):
    """
    Get the value for a key from the cache.

    Args:
        key (str): The cache key to retrieve.

    Returns:
        any: The cached value, or None if the key does not exist.
    """
    logger.debug(f"Getting {key} from cache")
    return cache.get(key)
