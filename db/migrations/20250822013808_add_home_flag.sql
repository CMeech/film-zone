-- migrate:up
DROP TABLE Games;

CREATE TABLE Games (
    id INTEGER PRIMARY KEY,
    game_data TEXT,
    opponent_name TEXT NOT NULL,
    is_home BOOLEAN NOT NULL DEFAULT FALSE,
    final_score TEXT,
    event_id INTEGER,
    team_id INTEGER NOT NULL,
    video_url TEXT,
    FOREIGN KEY (event_id) REFERENCES Events (id),
    FOREIGN KEY (team_id) REFERENCES Teams (id)
);


-- migrate:down
DROP TABLE Games;

CREATE TABLE Games (
    id INTEGER PRIMARY KEY,
    game_data TEXT,
    opponent_name TEXT NOT NULL,
    is_home BOOLEAN NOT NULL DEFAULT FALSE,
    final_score TEXT,
    event_id INTEGER,
    team_id INTEGER NOT NULL,
    video_url TEXT,
    FOREIGN KEY (event_id) REFERENCES Events (id),
    FOREIGN KEY (team_id) REFERENCES Teams (id)
);
