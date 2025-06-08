import sqlite3

from config.config import getConfig
from libs.logging.logging import logger

def init_db():
    try:
        conn = sqlite3.connect(getConfig().DB_FILE)
        # c = conn.cursor()
        # c.execute('''
        #     CREATE TABLE IF NOT EXISTS user (
        #         id INTEGER PRIMARY KEY AUTOINCREMENT,
        #         username VARCHAR(50) NOT NULL,
        #         password_hash VARCHAR(100) NOT NULL,
        #         role VARCHAR(40) NOT NULL
        #     )
        # ''')
        # conn.commit()
        conn.close()

        logger.info("Database initialized successfully using file %s" % getConfig().DB_FILE)
    except Exception as e:
        logger.fatal(f"Failed to initialize database: {e}")


# note: this is thread safe.
# however, sqlite defaults to the SERIALIZABLE isolation level.
# meaning that multiple threads can't have write access the database at the same time.
# https://sqlite.org/serializable.html
#
# Use for more comples transactions with multi-query execution
def get_connection() -> sqlite3.Connection:
    return sqlite3.connect(getConfig().DB_FILE)

# Use for single row, single query transactions
def fetch_one(query, params):
    conn = get_connection()
    c = conn.cursor()
    c.execute(query, params)
    result = c.fetchone()
    conn.close()
    return result

def execute_modifying_query(query, params) -> None:
    conn = get_connection()
    c = conn.cursor()
    c.execute(query, params)
    conn.commit()
    conn.close()