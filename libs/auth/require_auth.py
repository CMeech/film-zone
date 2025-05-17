from flask import redirect, session
from libs.hash.generate_token import generate_token
from functools import wraps
from config.config import getConfig

def require_auth(f):
    """
    Decorator to require authentication to access a view.

    If the user is not authenticated (i.e. session['auth_token'] is not
    equal to the access password), redirect to the login page.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = session.get('auth_token')
        if token != generate_token(getConfig().ACCESS_PASSWORD):
            return redirect('/auth/login')
        return f(*args, **kwargs)
    return wrapper