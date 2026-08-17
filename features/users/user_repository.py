from features.db.db import execute_modifying_query, fetch_all, fetch_one, get_connection
from features.users.player import Player
from features.users.role import Role
from features.users.user import User
from libs.auth.credentials import hash_credential, verify_credential

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

def verify_coach_login(username: str, password: str) -> User | None:
    conn = get_connection()
    try:
        result = conn.execute(
            """
            SELECT u.id, u.username, u.display_name, u.role, u.password_hash
            FROM users u
            WHERE u.username = ?
            LIMIT 1
            """,
            (username,),
        ).fetchone()
        if result is None:
            return None

        matches, needs_upgrade = verify_credential(result[4], password)
        if not matches:
            return None
        if needs_upgrade:
            conn.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (hash_credential(password), result[0]),
            )
            conn.commit()
        return User(*result[:4])
    finally:
        conn.close()

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

def verify_player_login(access_code: str) -> User | None:
    conn = get_connection()
    try:
        results = conn.execute(
            """
            SELECT u.id, u.username, u.display_name, u.role, u.password_hash
            FROM users u
            WHERE u.username IS NULL
            ORDER BY u.id
            """
        ).fetchall()
        for result in results:
            matches, needs_upgrade = verify_credential(result[4], access_code)
            if not matches:
                continue
            if needs_upgrade:
                conn.execute(
                    "UPDATE users SET password_hash = ? WHERE id = ?",
                    (hash_credential(access_code), result[0]),
                )
                conn.commit()
            return User(*result[:4])
        return None
    finally:
        conn.close()

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

def get_user_teams(user_id: int) -> list[int]:
    query = """
        SELECT t.id
        FROM Teams t
             JOIN UserTeams ut on t.id = ut.team_id
        WHERE ut.user_id = ?
    """
    params = (user_id,)
    result = fetch_all(query, params)
    return result if result is not None else []

def reset_password(user_id: int, access_code_hash: str):
    query = """
            UPDATE Users
            SET password_hash = ?
            WHERE id = ?
    """
    params = (access_code_hash, user_id)
    execute_modifying_query(query, params)
