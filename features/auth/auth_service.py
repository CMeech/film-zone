# This will manage the cache for user access tokens
# This will be used to authenticate users

from libs.cache.cache import add_to_cache, key_exists
from libs.hash.generate_token import generate_token
from features.users.user_repository import verify_coach_login, verify_player_login

# returns an access token if valid
def authenticate_player_login(access_code_hash: str) -> str:
    user = verify_player_login(access_code_hash)
    if user is None:
        return None
    # TODO: Include a connection specific property in the hash, can be timestamp too
    token = generate_token(access_code_hash)
    add_to_cache(token, "placeholder", 3600)
    return token

def authenticate_coach_login(username: str, password_hash: str) -> str:
    user = verify_coach_login(username, password_hash)
    if user is None:
        return None
    token = generate_token(username+password_hash)
    add_to_cache(token, "placeholder", 3600)
    return token

def is_valid_token(token: str) -> bool:
    return key_exists(token)
