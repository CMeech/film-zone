import hashlib

def username_to_gradient(username: str) -> tuple[str, str]:
    """
    Generate a Tailwind-compatible gradient start/end from a username.
    """
    # Create a deterministic hash from username
    h = hashlib.sha256(username.encode('utf-8')).hexdigest()

    # Pick two points in the hash for color values
    start_color = f"#{h[0:6]}"
    end_color = f"#{h[6:12]}"

    return start_color, end_color

def init_template_filters(app):
    @app.template_filter('format_date')
    def format_date(value, format='%Y-%m-%d'):
        return value.strftime(format)

    @app.template_filter('username_gradient')
    def username_gradient(username):
        start, end = username_to_gradient(username)
        return f"background-image: linear-gradient(to right, {start}, {end});"
