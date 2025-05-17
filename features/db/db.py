import sqlite3

from config.config import getConfig

def init_db():
    conn = sqlite3.connect(getConfig().DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) NOT NULL,
            password_hash VARCHAR(100) NOT NULL,
            role VARCHAR(40) NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def get_connection() -> sqlite3.Connection:
    return sqlite3.connect(getConfig().DB_FILE)