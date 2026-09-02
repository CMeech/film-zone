# Production configuration

FilmZone selects its application configuration with `FILMZONE_ENV`. Production
must set these environment variables in the systemd unit (or its referenced
environment file):

| Variable | Required value or purpose |
| --- | --- |
| `FILMZONE_ENV` | Must be `production`. |
| `FLASK_SECRET_KEY` | Required, private random value used to sign sessions. It must not be `super_secret_session_key`. |
| `SESSION_COOKIE_SECURE` | Defaults to `true` in production. Only set to `false` for an explicitly non-HTTPS diagnostic environment. |
| `SESSION_COOKIE_DOMAIN` | Current deployment-specific cookie domain; confirm the live `app.filmzone.ca` value before changing it. |
| `CACHE_TYPE` | Use `RedisCache` when more than one process or instance serves requests. |
| `CACHE_REDIS_URL` | Optional complete `redis://`, `rediss://`, or `unix://` connection URL. When set, it takes precedence over every individual Redis setting below. |
| `CACHE_REDIS_HOST` | Redis hostname when Redis caching is enabled. |
| `CACHE_REDIS_PORT` | Redis port; parsed as an integer. |
| `CACHE_REDIS_DB` | Redis database index; parsed as an integer. |
| `CACHE_REDIS_PASSWORD` | Redis password when the server requires one. |

When production selects `CACHE_TYPE=RedisCache`, startup pings Redis and fails
with a cache configuration error if the service cannot be reached or
authenticated. FilmZone does not silently fall back to `SimpleCache`. A single
two-thread process remains supported with `SimpleCache`, including the current
deployment topology, but every process or application instance has its own
cache in that mode. Multiple processes or instances therefore require Redis so
that authentication tokens are shared. Flask-Limiter remains a separate,
process-local store; this cache configuration does not change its storage.

Optional integer settings are `CACHE_DEFAULT_TIMEOUT`,
`PERMANENT_SESSION_LIFETIME`, `MAX_BODY_SIZE`, `MAX_CONTENT_LENGTH`, and
`MAX_FORM_MEMORY_SIZE`. Optional boolean settings are
`EXPLAIN_TEMPLATE_LOADING` and `SESSION_COOKIE_SECURE`. Boolean values accept
`true/false`, `yes/no`, `on/off`, or `1/0` (case-insensitive); invalid values
stop application startup with a configuration error.

Development defaults to `FILMZONE_ENV=development` when the variable is absent.
Tests set `RUN_TESTS=true`, which explicitly selects
`stats-data/stats-test.db`. `FLASK_ENV` may still control the container
entrypoint's development server, but it does not select application settings.
