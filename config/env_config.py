import os

def get_env_var(var_name, default=None):
    return os.environ.get(var_name, default)

class EnvConfig:
    ACCESS_PASSWORD = get_env_var("ACCESS_PASSWORD", "letmein123")  # Use DB for this later
    EXPLAIN_TEMPLATE_LOADING = get_env_var("EXPLAIN_TEMPLATE_LOADING", False)
    FLASK_SECRET_KEY = get_env_var("FLASK_SECRET_KEY", "super_secret_session_key")
    LOG_LEVEL = get_env_var("LOG_LEVEL", "INFO").upper()
    MAX_FORM_MEMORY_SIZE = get_env_var("MAX_FORM_MEMORY_SIZE", 1024 * 50)
    PERMANENT_SESSION_LIFETIME = get_env_var("PERMANENT_SESSION_LIFETIME", 3600)
    SESSION_COOKIE_DOMAIN = get_env_var("SESSION_COOKIE_DOMAIN", "localhost")
    SESSION_COOKIE_NAME = get_env_var("SESSION_COOKIE_NAME", "session")
    SESSION_COOKIE_SAMESITE = get_env_var("SESSION_COOKIE_SAMESITE", "Strict")
    SESSION_COOKIE_SECURE = get_env_var("SESSION_COOKIE_SECURE", False)

    @property
    def DB_FILE(self):
        return get_env_var("DB_FILE", "stats-data/stats.db")
