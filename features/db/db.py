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

def get_connection() -> sqlite3.Connection:
    return sqlite3.connect(getConfig().DB_FILE)