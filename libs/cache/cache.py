from flask_caching import Cache

cache = Cache()

# we need to add a true logger

def init_cache(app):
    # enable caching
    app.config['CACHE_TYPE'] = 'SimpleCache'  # Other options: RedisCache, MemcachedCache, etc.
    app.config['CACHE_DEFAULT_TIMEOUT'] = 600  # Cache for 10 minutes

    # Initialize extensions
    cache.init_app(app)