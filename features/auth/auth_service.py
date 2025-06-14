# This will manage the cache for user access tokens
# This will be used to authenticate users

from features.users.role import Role
from features.users.user import User
from libs.cache.cache import add_to_cache, get_value
from libs.context.user_context import get_user_profile
from libs.hash.generate_token import generate_token
from features.users.user_repository import verify_coach_login, verify_player_login
from libs.logging.logging import logger

ACCESS_TOKEN = "access_token"

# returns an access token if valid
def authenticate_player_login(access_code_hash: str) -> str:
    user = verify_player_login(access_code_hash)
    if user is None:
        return None
    user.username = ACCESS_TOKEN
    # TODO: Include a connection specific property in the hash, can be timestamp too
    token = generate_token(access_code_hash)
    add_to_cache(token, user, 7200)
    return token

def authenticate_coach_login(username: str, password_hash: str) -> str:
    user = verify_coach_login(username, password_hash)
    if user is None:
        return None
    token = generate_token(username+password_hash)
    add_to_cache(token, user, 7200)
    return token

def get_user_from_token(token: str) -> User:
    user = get_value(token)
    if user is None:
        logger.debug(f"Token {token} is invalid")
    elif user.username == ACCESS_TOKEN:
        logger.debug(f"Player access token is valid")
    else:
        logger.debug(f"User {user.username} was detected")
    return user

def is_authorized(roles: list[Role]) -> bool:
    user = get_user_profile()
    if (user is not None):
        logger.debug(f"Checking authorization for user {user.username}. Roles {[role.name for role in roles]}")
    else:
        logger.debug("User is not authenticated")
    return user is not None and user.role in roles
