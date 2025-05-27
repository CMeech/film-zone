from config.config import getConfig
from libs.logging.logging import logger
from flask_cors import CORS
from flask_wtf import CSRFProtect
import secrets
from flask import g

# Re-factor later to use environment variables
# I don't think we need to whitelist localhost:60991 since the HTML is served from localhost
# Thus it is not a Cross-Origin scenraio.
# If we had a separate front-end, we would white-list it here
ALLOWED_ORIGINS = {}

def apply_security_headers(app):
    config = getConfig()
    csrf = CSRFProtect(app)

    CORS(app, origins=ALLOWED_ORIGINS, methods=['GET', 'POST', 'PATCH', 'DELETE'], supports_credentials=False)
    # the following allows for more controlled CORS for specific API endpoints
    #CORS(app, resources={r"/api/*": {"origins": "https://{config.SESSION_COOKIE_DOMAIN}.com", "http://{config.SESSION_COOKIE_DOMAIN}.com"}})

    @app.before_request
    def generate_nonce():
        # g is a special context object that is unique for each request
        g.csp_nonce = secrets.token_urlsafe(16)  # Unique nonce per request

    @app.after_request
    def set_security_headers(response):
        # 1. Content Security Policy (CSP)
        nonce = getattr(g, 'csp_nonce', '')
        
        response.headers['Content-Security-Policy'] = (
            f"default-src 'self'; "
            f"script-src 'self' 'nonce-{nonce}' https://cdn.jsdelivr.net; "
            f"style-src 'self' 'unsafe-inline'; " # Tailwind is not compatible with CSP nonce due to @property
            f"frame-src https://www.youtube.com https://view.officeapps.live.com; "
            f"font-src 'self' https://cdn.jsdelivr.net; "
            f"img-src 'self' data:;"
        )

        # 2. Clickjacking protection
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'

        # 3. XSS protection (deprecated in modern browsers but still useful)
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # 4. MIME-type sniffing protection
        response.headers['X-Content-Type-Options'] = 'nosniff'

        # 5. Strict Transport Security (HSTS)
        # Enable only if serving entirely over HTTPS
        # Possible make a new flag for ENABLE_SSL
        if (getConfig().SESSION_COOKIE_SECURE):
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # 6. Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # 7. Permissions policy (formerly Feature Policy)
        response.headers['Permissions-Policy'] = (
            "geolocation=(), microphone=(), camera=(), fullscreen=(self)"
        )

        return response
    
    logger.info("Security headers applied.")
