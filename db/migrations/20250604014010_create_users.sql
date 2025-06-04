-- migrate:up
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    persona VARCHAR(40) NOT NULL
);

-- migrate:down
DELETE TABLE IF EXISTS user;
