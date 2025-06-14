from features.users.role import Role
from flask import session, flash, render_template
from functools import wraps
from features.auth.auth_service import is_authorized
from libs.logging.logging import logger

def pre_authorize(roles: list[Role]):
    """
    Decorator to require authorization to access a view via a role.
    This should wrap the require_auth decorator

    If the user is not authorized, redirect to the error page.
    """
    def require_role(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # assumes user is already authenticated
            if is_authorized(roles) is False:
                flash('You are not authorized to access this page.')
                return render_template('error/error.html')
            return f(*args, **kwargs)
        return wrapper
    return require_role