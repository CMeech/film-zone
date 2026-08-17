import hashlib
import hmac

from werkzeug.security import check_password_hash, generate_password_hash


LEGACY_SHA256_HEX_LENGTH = 64


def hash_credential(secret: str) -> str:
    """Create a salted, deliberately slow hash for a stored credential."""
    return generate_password_hash(secret)


def verify_credential(stored_hash: str, secret: str) -> tuple[bool, bool]:
    """Return whether a credential matches and whether its hash needs upgrading."""
    # TODO: Remove legacy SHA-256 verification after all deployed credentials have
    # migrated to Werkzeug hashes and the migration window has ended.
    if _is_legacy_sha256(stored_hash):
        candidate_hash = hashlib.sha256(secret.encode()).hexdigest()
        matches = hmac.compare_digest(stored_hash.lower(), candidate_hash)
        return matches, matches

    try:
        return check_password_hash(stored_hash, secret), False
    except (ValueError, TypeError):
        return False, False


def _is_legacy_sha256(stored_hash: str) -> bool:
    if not isinstance(stored_hash, str) or len(stored_hash) != LEGACY_SHA256_HEX_LENGTH:
        return False
    try:
        int(stored_hash, 16)
    except ValueError:
        return False
    return True
