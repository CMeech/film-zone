-- migrate:up
UPDATE Events SET date = date || ' 00:00:00' WHERE length(date) = 10;

-- migrate:down
-- Strip the time portion from datetime strings
UPDATE Events SET date = substr(date, 1, 10) WHERE length(date) = 19;
