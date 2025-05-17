from flask import Flask
from config.config import getConfig

from libs.cache.cache import init_cache
from features.db.db import init_db
from features.register_views import register_views

def create_app():
    config = getConfig()
    init_db()
    app = Flask(__name__)
    app.secret_key = getConfig().FLASK_SECRET_KEY
    app.session_cookie_secure = config.SESSION_COOKIE_SECURE
    app.session_cookie_name = config.SESSION_COOKIE_NAME
    app.session_cookie_domain = config.SESSION_COOKIE_DOMAIN
    app.session_cookie_samesite = config.SESSION_COOKIE_SAMESITE
    app.permanent_session_lifetime = config.PERMANENT_SESSION_LIFETIME
    app.max_form_memory_size = config.MAX_FORM_MEMORY_SIZE
    app.explain_template_loading = config.EXPLAIN_TEMPLATE_LOADING
    init_cache(app)
    register_views(app)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
