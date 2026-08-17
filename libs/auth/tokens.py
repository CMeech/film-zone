import secrets


def generate_access_token() -> str:
    """Create an opaque, unpredictable token for a cached login session."""
    return secrets.token_urlsafe(32)
