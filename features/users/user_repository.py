from features.db.db import execute_modifying_query, fetch_all, fetch_one
from features.users.player import Player
from features.users.role import Role
from features.users.user import User

def get_all_users() -> list[User]:
    query = """
        SELECT u.id, u.username, u.display_name, u.role FROM users u
    """
    result = fetch_all(query, ())
    users = [User(*user) for user in result]
    return users

def get_all_players() -> list[User]:
    query = """
        SELECT u.id, u.username, u.role FROM users u
        WHERE u.role = ?
    """
    params = (Role.PLAYER.value,)
    result = fetch_all(query, ())
    users = [User(*user) for user in result]
    return users

def verify_coach_login(username: str, password_hash: str) -> User:
    query = """
        SELECT u.id, u.username, display_name, u.role FROM users u
        WHERE u.username = ? AND u.password_hash = ?
        LIMIT 1"""
    params = (username, password_hash)
    result = fetch_one(query, params)
    if result is None:
        return None
    # short-hand for unpacking a tuple in Python
    user = User(*result)
    return user

def create_access_code(access_code_hash: str, role: Role) -> Player:
    query = """
        INSERT INTO users (password_hash, role)
        VALUES (?, ?)
    """
    params = (access_code_hash, role.value)
    execute_modifying_query(query, params)
    result_query = """
        SELECT u.id FROM users u where u.password_hash = ?
    """
    result_params = (access_code_hash,)
    result = fetch_one(result_query, result_params)
    return Player(*result)

def verify_player_login(access_code_hash: str) -> User:
    query = """
        SELECT u.id, u.display_name, u.username, u.role FROM users u
        WHERE u.username is null AND u.password_hash = ?
        LIMIT 1"""
    # Must include comma after to ensure tuple only includes one element
    params = (access_code_hash,)
    result = fetch_one(query, params)
    if result is None:
        return None
    # shorthand for unpacking a tuple in Python
    user = User(*result)
    return user

def create_user(username: str, display_name: str, password_hash: str, role: Role) -> User:
    query = """
        INSERT INTO users (username, display_name, password_hash, role)
        VALUES (?, ?, ?, ?)
    """
    params = (username, display_name, password_hash, role.value)
    execute_modifying_query(query, params)
    result_query = """
        SELECT u.id, u.username, u.display_name, u.role
        FROM users u where u.username = ?
    """
    result_params = (username,)
    result = fetch_one(result_query, result_params)
    return User(*result)

def admin_exists() -> bool:
    query = """
        SELECT u.id, u.username, u.display_name, u.role FROM users u
        WHERE u.role = ?
        LIMIT 1"""
    params = (Role.ADMIN.value,)
    result = fetch_one(query, params)
    return result is not None