from flask import redirect, session
from functools import wraps
from features.auth.auth_service import is_valid_token

def require_auth(f):
    """
    Decorator to require authentication to access a view.

    If the user is not authenticated (i.e. session['auth_token'] is not
    equal to the access password), redirect to the login page.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = session.get('auth_token')
        if is_valid_token(token) is False:
            return redirect('/auth/login/access')
        return f(*args, **kwargs)
    return wrapper