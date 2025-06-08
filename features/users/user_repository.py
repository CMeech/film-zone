from features.db.db import fetch_one
from features.users.user import User

def verify_coach_login(username: str, password_hash: str) -> User:
    query = """
        SELECT u.id, u.username, u.role FROM users u
        WHERE u.username = ? AND u.password_hash = ?
        LIMIT 1"""
    params = (username, password_hash)
    result = fetch_one(query, params)
    if result is None:
        return None
    # short-hand for unpacking a tuple in Python
    user = User(*result)
    return user

def verify_player_login(access_code_hash: str) -> User:
    query = """
        SELECT u.id, u.username, u.role FROM users u
        WHERE u.username is null AND u.password_hash = ?
        LIMIT 1"""
    # Must include comma after to ensure tuple only includes one element
    params = (access_code_hash,)
    result = fetch_one(query, params)
    if result is None:
        return None
    # short-hand for unpacking a tuple in Python
    user = User(*result)
    return user