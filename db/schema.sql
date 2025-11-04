DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS folders;

CREATE TABLE folders (
  id    SERIAL PRIMARY KEY,
  name  TEXT    NOT NULL UNIQUE
);

CREATE TABLE files (
  id         SERIAL PRIMARY KEY,
  name       TEXT    NOT NULL,
  size       INTEGER NOT NULL,
  folder_id  INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  CONSTRAINT files_name_folder_unique UNIQUE (name, folder_id)
);
