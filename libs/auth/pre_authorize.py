from features.users.role import Role
from flask import session, flash, render_template
from functools import wraps
from features.auth.auth_service import is_authorized

def pre_authorize(role: Role):
    """
    Decorator to require authorization to access a view via a role.
    This should wrap the require_auth decorator

    If the user is not authorized, redirect to the error page.
    """
    def require_role(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            token = session.get('auth_token')
            if is_authorized(token, role) is False:
                flash('You are not authorized to access this page.')
                return render_template('error/error.html')
            return f(*args, **kwargs)
        return wrapper
    return require_role