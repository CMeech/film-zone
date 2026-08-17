import hashlib
import sqlite3

import pytest
from werkzeug.security import check_password_hash

from features.users import user_repository
from features.users.role import Role
from libs.auth.credentials import hash_credential, verify_credential


@pytest.fixture()
def credential_db(tmp_path, monkeypatch):
    database_path = tmp_path / "credentials.db"
    conn = sqlite3.connect(database_path)
    conn.execute(
        """
        CREATE TABLE Users (
            id INTEGER PRIMARY KEY,
            password_hash TEXT NOT NULL,
            username TEXT,
            role TEXT NOT NULL,
            display_name TEXT
        )
        """
    )
    conn.commit()
    conn.close()
    monkeypatch.setattr(
        user_repository,
        "get_connection",
        lambda: sqlite3.connect(database_path),
    )
    return database_path


def insert_user(database_path, password_hash, username, role, display_name=None):
    conn = sqlite3.connect(database_path)
    cursor = conn.execute(
        """
        INSERT INTO Users (password_hash, username, role, display_name)
        VALUES (?, ?, ?, ?)
        """,
        (password_hash, username, role.value, display_name),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id


def stored_hash(database_path, user_id):
    conn = sqlite3.connect(database_path)
    value = conn.execute(
        "SELECT password_hash FROM Users WHERE id = ?", (user_id,)
    ).fetchone()[0]
    conn.close()
    return value


def test_new_credential_hash_is_salted_and_verifiable():
    first = hash_credential("correct horse battery staple")
    second = hash_credential("correct horse battery staple")

    assert first != second
    assert check_password_hash(first, "correct horse battery staple")
    assert verify_credential(first, "correct horse battery staple") == (True, False)
    assert verify_credential(first, "wrong") == (False, False)


def test_coach_login_accepts_new_hash_and_rejects_invalid_password(credential_db):
    password_hash = hash_credential("coach-password")
    user_id = insert_user(
        credential_db, password_hash, "coach", Role.COACH, "Coach"
    )

    user = user_repository.verify_coach_login("coach", "coach-password")

    assert user.id == user_id
    assert user.role == Role.COACH
    assert user_repository.verify_coach_login("coach", "incorrect") is None
    assert stored_hash(credential_db, user_id) == password_hash


def test_successful_legacy_coach_login_upgrades_hash(credential_db):
    legacy_hash = hashlib.sha256(b"old-password").hexdigest()
    user_id = insert_user(
        credential_db, legacy_hash, "legacy-coach", Role.COACH, "Legacy Coach"
    )

    user = user_repository.verify_coach_login("legacy-coach", "old-password")
    upgraded_hash = stored_hash(credential_db, user_id)

    assert user.id == user_id
    assert upgraded_hash != legacy_hash
    assert check_password_hash(upgraded_hash, "old-password")


def test_failed_legacy_coach_login_does_not_upgrade_hash(credential_db):
    legacy_hash = hashlib.sha256(b"old-password").hexdigest()
    user_id = insert_user(
        credential_db, legacy_hash, "legacy-coach", Role.COACH, "Legacy Coach"
    )

    assert user_repository.verify_coach_login("legacy-coach", "incorrect") is None
    assert stored_hash(credential_db, user_id) == legacy_hash


def test_player_login_scans_salted_hashes_and_upgrades_legacy_match(credential_db):
    insert_user(credential_db, hash_credential("other-code"), None, Role.PLAYER)
    legacy_hash = hashlib.sha256(b"team-code").hexdigest()
    user_id = insert_user(credential_db, legacy_hash, None, Role.PLAYER)

    user = user_repository.verify_player_login("team-code")
    upgraded_hash = stored_hash(credential_db, user_id)

    assert user.id == user_id
    assert user.role == Role.PLAYER
    assert upgraded_hash != legacy_hash
    assert check_password_hash(upgraded_hash, "team-code")
    assert user_repository.verify_player_login("invalid-code") is None
