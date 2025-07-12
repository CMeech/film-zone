from flask import redirect, session
from functools import wraps
from features.auth.auth_service import get_user_from_token
from libs.context.user_context import set_user_profile
from libs.logging.logging import logger

def require_auth(f):
    """
    Decorator to require authentication to access a view.

    If the user is not authenticated (i.e. session['auth_token'] is not
    equal to the access password), redirect to the login page.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = session.get('auth_token')
        profile = get_user_from_token(token)
        if profile is None:
            return redirect('/auth/login/access')
        set_user_profile(profile)
        logger.debug(f"User {profile.user.username} is authenticated")
        return f(*args, **kwargs)
    return wrapper