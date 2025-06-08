# This will manage the cache for user access tokens
# This will be used to authenticate users

from libs.cache.cache import add_to_cache, get_value, key_exists
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

def is_valid_token(token: str) -> bool:
    user = get_value(token)
    if user is None:
        logger.debug(f"Token {token} is invalid")
        return False
    elif user.username == ACCESS_TOKEN:
        logger.debug(f"Player access token is valid")
        return True
    else:
        logger.debug(f"User {user.username} was detected")
        return True

def is_authorized(token: str, role: str) -> bool:
    user = get_value(token)
    return user is not None and user.role == role
