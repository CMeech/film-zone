-- migrate:up
CREATE TABLE Users (
    id INTEGER PRIMARY KEY,
    password_hash TEXT NOT NULL,
    username TEXT,
    role TEXT NOT NULL
);

CREATE TABLE Teams (
    id INTEGER PRIMARY KEY,
    year INTEGER NOT NULL,
    name TEXT NOT NULL,
    logo_path TEXT
);

CREATE TABLE Players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    number INTEGER,
    position TEXT,
    birth_year INTEGER
);

CREATE TABLE UserTeams (
    user_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES Users (id),
    FOREIGN KEY (team_id) REFERENCES Teams (id)
);

CREATE TABLE Rosters (
    team_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    PRIMARY KEY (team_id, player_id),
    FOREIGN KEY (team_id) REFERENCES Teams (id),
    FOREIGN KEY (player_id) REFERENCES Players (id)
);

CREATE TABLE Games (
    id INTEGER PRIMARY KEY,
    game_data TEXT,
    visiting_team_name TEXT NOT NULL,
    final_score TEXT,
    event_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Events (id),
    FOREIGN KEY (team_id) REFERENCES Teams (id)
);

CREATE TABLE Announcements (
    id INTEGER PRIMARY KEY,
    author TEXT NOT NULL,
    message TEXT NOT NULL,
    date DATE NOT NULL,
    team_id INTEGER NOT NULL,
    FOREIGN KEY (author) REFERENCES Users (username),
    FOREIGN KEY (team_id) REFERENCES Teams (id)
);

CREATE TABLE Files (
    id INTEGER PRIMARY KEY,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES Teams (id)
);

CREATE TABLE Events (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    details TEXT,
    date DATE NOT NULL,
    location TEXT NOT NULL,
    duration INTEGER, -- duration will be in minutes
    team_id INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES Teams (id)
);

-- migrate:down
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Teams;
DROP TABLE IF EXISTS UserTeams;
DROP TABLE IF EXISTS Players;
DROP TABLE IF EXISTS Rosters;
DROP TABLE IF EXISTS Games;
DROP TABLE IF EXISTS Announcements;
DROP TABLE IF EXISTS Files;
DROP TABLE IF EXISTS Events;
