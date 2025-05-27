from flask_limiter import Limiter

def get_session_id():
    from flask import session
    from flask_limiter.util import get_remote_address
    return session.get("auth_token", get_remote_address())

# We might want to disable this for tests
def init_limiter(app, limiter):
    limiter.init_app(app)

limiter = Limiter(get_session_id)

