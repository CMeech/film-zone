from config.config import getConfig

from libs.cache.cache import init_cache
from features.db.db import init_db
from features.register_views import register_views
from libs.security.security_headers import apply_security_headers
from libs.security.rate_limit import init_limiter, limiter

def set_app_properties(app):
    config = getConfig()
    app.config['SECRET_KEY'] = config.FLASK_SECRET_KEY
    app.config['SESSION_COOKIE_SECURE'] = config.SESSION_COOKIE_SECURE
    app.config['SESSION_COOKIE_NAME'] = config.SESSION_COOKIE_NAME
    app.config['SESSION_COOKIE_DOMAIN'] = config.SESSION_COOKIE_DOMAIN
    app.config['SESSION_COOKIE_SAMESITE'] = config.SESSION_COOKIE_SAMESITE
    app.config['PERMANENT_SESSION_LIFETIME'] = config.PERMANENT_SESSION_LIFETIME
    app.config['MAX_FORM_MEMORY_SIZE'] = config.MAX_FORM_MEMORY_SIZE
    app.config['EXPLAIN_TEMPLATE_LOADING'] = config.EXPLAIN_TEMPLATE_LOADING

def setup_app(app):
    init_db()
    set_app_properties(app)
    init_cache(app)
    # Rate limiter must be setup before views are registered
    init_limiter(app, limiter)
    register_views(app)
    apply_security_headers(app)
    return app