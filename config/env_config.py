import os
from collections.abc import Mapping


DEVELOPMENT_SECRET_KEY = "super_secret_session_key"
TRUE_VALUES = frozenset({"1", "true", "yes", "on"})
FALSE_VALUES = frozenset({"0", "false", "no", "off"})


class ConfigError(ValueError):
    """Raised when an environment setting cannot be parsed or validated."""


def get_string(name, default=None, environ: Mapping[str, str] | None = None):
    source = os.environ if environ is None else environ
    return source.get(name, default)


def get_required(name, environ: Mapping[str, str] | None = None) -> str:
    value = get_string(name, environ=environ)
    if value is None or not value.strip():
        raise ConfigError(f"{name} is required")
    return value


def get_bool(name, default=False, environ: Mapping[str, str] | None = None) -> bool:
    value = get_string(name, default, environ)
    if isinstance(value, bool):
        return value

    normalized = str(value).strip().lower()
    if normalized in TRUE_VALUES:
        return True
    if normalized in FALSE_VALUES:
        return False
    raise ConfigError(
        f"{name} must be a boolean "
        f"({', '.join(sorted(TRUE_VALUES | FALSE_VALUES))}); got {value!r}"
    )


def get_int(name, default=None, environ: Mapping[str, str] | None = None) -> int:
    value = get_string(name, default, environ)
    try:
        return int(value)
    except (TypeError, ValueError) as error:
        raise ConfigError(f"{name} must be an integer; got {value!r}") from error


class EnvConfig:
    IS_PRODUCTION = False

    def __init__(self, environ: Mapping[str, str] | None = None):
        self._environ = os.environ if environ is None else environ

        self.ADMIN_PASSWORD = get_string("ADMIN_PASSWORD", environ=self._environ)
        self.ADMIN_USERNAME = get_string("ADMIN_USERNAME", environ=self._environ)
        self.ADMIN_DISPLAY_NAME = get_string("ADMIN_DISPLAY_NAME", environ=self._environ)
        self.CACHE_TYPE = get_string("CACHE_TYPE", "SimpleCache", self._environ)
        self.CACHE_DEFAULT_TIMEOUT = get_int("CACHE_DEFAULT_TIMEOUT", 600, self._environ)
        self.CACHE_REDIS_HOST = get_string("CACHE_REDIS_HOST", "localhost", self._environ)
        self.CACHE_REDIS_PORT = get_int("CACHE_REDIS_PORT", 6379, self._environ)
        self.CACHE_REDIS_DB = get_int("CACHE_REDIS_DB", 0, self._environ)
        self.CACHE_REDIS_PASSWORD = get_string("CACHE_REDIS_PASSWORD", environ=self._environ)
        self.CACHE_REDIS_URL = get_string("CACHE_REDIS_URL", environ=self._environ)
        self.EXPLAIN_TEMPLATE_LOADING = get_bool(
            "EXPLAIN_TEMPLATE_LOADING", False, self._environ
        )
        self.FLASK_SECRET_KEY = get_string(
            "FLASK_SECRET_KEY", DEVELOPMENT_SECRET_KEY, self._environ
        )
        self.LOG_LEVEL = get_string("LOG_LEVEL", "INFO", self._environ).upper()
        self.MAX_BODY_SIZE = get_int("MAX_BODY_SIZE", 32 * 1024 * 1024, self._environ)
        self.MAX_CONTENT_LENGTH = get_int(
            "MAX_CONTENT_LENGTH", 32 * 1024 * 1024, self._environ
        )
        self.MAX_FORM_MEMORY_SIZE = get_int(
            "MAX_FORM_MEMORY_SIZE", 32 * 1024 * 1024, self._environ
        )
        self.PERMANENT_SESSION_LIFETIME = get_int(
            "PERMANENT_SESSION_LIFETIME", 3600, self._environ
        )
        self.SESSION_COOKIE_DOMAIN = get_string(
            "SESSION_COOKIE_DOMAIN", "localhost", self._environ
        )
        self.SESSION_COOKIE_NAME = get_string("SESSION_COOKIE_NAME", "session", self._environ)
        self.SESSION_COOKIE_SAMESITE = get_string(
            "SESSION_COOKIE_SAMESITE", "Strict", self._environ
        )
        self.SESSION_COOKIE_SECURE = get_bool(
            "SESSION_COOKIE_SECURE", False, self._environ
        )
        self.DB_FILE = get_string("DB_FILE", "stats-data/stats.db", self._environ)
