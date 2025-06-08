from flask_caching import Cache

cache = Cache()

def init_cache(app):
    # enable caching
    app.config['CACHE_TYPE'] = 'SimpleCache'  # Other options: RedisCache, MemcachedCache, etc.
    app.config['CACHE_DEFAULT_TIMEOUT'] = 600  # Cache for 10 minutes

    # Initialize extensions
    cache.init_app(app)

def add_to_cache(key, value, timeout):
    """
    Add a value to the cache for a specified time and key.

    Args:
        key (str): The cache key.
        value (any): The value to cache.
        timeout (int): The time in seconds to cache the value.

    Returns:
        None
    """
    cache.set(key, value, timeout=timeout)

def remove_from_cache(key):
    """
    Remove a key from the cache.

    Args:
        key (str): The cache key to remove.

    Returns:
        None
    """
    cache.delete(key)

def key_exists(key):
    """
    Check if a key exists in the cache.

    Args:
        key (str): The cache key to check.

    Returns:
        bool: True if the key exists, False otherwise.
    """
    return cache.get(key) is not None

def get_value(key):
    """
    Get the value for a key from the cache.

    Args:
        key (str): The cache key to retrieve.

    Returns:
        any: The cached value, or None if the key does not exist.
    """
    return cache.get(key)