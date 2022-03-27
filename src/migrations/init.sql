CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE TYPE index_status as ENUM ('indexed', 'failed', 'not_indexed');
CREATE TYPE relevancy as ENUM ('title', 'text', 'description', 'keyword', 'domain');

CREATE TABLE IF NOT EXISTS links (
  id uuid default uuid_generate_v4(),
  link varchar(255) NOT NULL UNIQUE,
  title varchar(255),
  description varchar(255),
  is_indexed index_status NOT NULL default 'not_indexed',
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS words (
  id uuid default uuid_generate_v4(),
  word varchar(255) NOT NULL UNIQUE,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS test_indexes (
  id uuid default uuid_generate_v4(),
  word_text varchar(255) REFERENCES words(word),
  link_text varchar(255) REFERENCES links(link),
  place integer NOT NULL,
  relevance relevancy default 'text',
  PRIMARY KEY (id)
);
