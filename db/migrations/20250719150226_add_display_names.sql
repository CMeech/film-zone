-- migrate:up
ALTER TABLE Users
    ADD COLUMN display_name VARCHAR(80);

UPDATE Users SET display_name = username;

-- migrate:down
ALTER TABLE Users DROP COLUMN display_name;