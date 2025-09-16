import os

def get_env_var(var_name, default=None):
    return os.environ.get(var_name, default)

class EnvConfig:
    ADMIN_PASSWORD = get_env_var("ADMIN_PASSWORD", None)
    ADMIN_USERNAME = get_env_var("ADMIN_USERNAME", None)
    ADMIN_DISPLAY_NAME = get_env_var("ADMIN_DISPLAY_NAME", None)
    CACHE_TYPE = get_env_var("CACHE_TYPE", "SimpleCache") # Other options: RedisCache, MemcachedCache, etc.
    CACHE_DEFAULT_TIMEOUT = get_env_var("CACHE_DEFAULT_TIMEOUT", 600) # 10 minutes
    CACHE_REDIS_HOST = get_env_var("CACHE_REDIS_HOST", "localhost")
    CACHE_REDIS_PORT = get_env_var("CACHE_REDIS_PORT", 6379)
    CACHE_REDIS_DB = get_env_var("CACHE_REDIS_DB", 0)
    CACHE_REDIS_PASSWORD = get_env_var("CACHE_REDIS_PASSWORD", None)
    CACHE_REDIS_URL = get_env_var("CACHE_REDIS_URL", None)
    EXPLAIN_TEMPLATE_LOADING = get_env_var("EXPLAIN_TEMPLATE_LOADING", False)
    FLASK_SECRET_KEY = get_env_var("FLASK_SECRET_KEY", "super_secret_session_key")
    LOG_LEVEL = get_env_var("LOG_LEVEL", "INFO").upper()
    MAX_BODY_SIZE = get_env_var("MAX_BODY_SIZE", 32 * 1024 * 1024) # 32 MB
    MAX_CONTENT_LENGTH = get_env_var("MAX_CONTENT_LENGTH", 32 * 1024 * 1024)
    MAX_FORM_MEMORY_SIZE = get_env_var("MAX_FORM_MEMORY_SIZE", 32 * 1024 * 1024)
    PERMANENT_SESSION_LIFETIME = get_env_var("PERMANENT_SESSION_LIFETIME", 3600)
    SESSION_COOKIE_DOMAIN = get_env_var("SESSION_COOKIE_DOMAIN", "localhost")
    SESSION_COOKIE_NAME = get_env_var("SESSION_COOKIE_NAME", "session")
    SESSION_COOKIE_SAMESITE = get_env_var("SESSION_COOKIE_SAMESITE", "Strict")
    SESSION_COOKIE_SECURE = get_env_var("SESSION_COOKIE_SECURE", False)

    @property
    def DB_FILE(self):
        return get_env_var("DB_FILE", "stats-data/stats.db")
