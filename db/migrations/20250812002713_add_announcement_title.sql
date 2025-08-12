-- migrate:up
alter table Announcements add column title text default 'No title';

-- migrate:down
alter table Announcements drop column title;
