-- migrate:up
ALTER TABLE events ADD COLUMN event_type TEXT NOT NULL DEFAULT 'Other';

-- migrate:down
ALTER TABLE events DROP COLUMN event_type;

