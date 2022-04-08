// CREATE TABLE IF NOT EXISTS domains_links (
//     id uuid default uuid_generate_v4(),
//     domain_text varchar(255) REFERENCES domains(name),
//     link_text varchar(255) REFERENCES links(link),
//     PRIMARY KEY(id)
// );

const initQuery = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS btree_gin;
  
  CREATE TABLE IF NOT EXISTS links (
      id uuid default uuid_generate_v4(),
      link varchar(255) NOT NULL UNIQUE,
      title varchar(255),
      description varchar(255),
      country varchar(50),
      region varchar(50),
      internal_links_count integer default 0,
      external_links_count integer default 0,
      pre_rank real NOT NULL default 0,
      link_type link_type NOT NULL default 'default',
      is_crawled crawled_status NOT NULL default 'not_crawled',
      is_indexed index_status NOT NULL default 'not_indexed',
      PRIMARY KEY (id)
  );
  
  CREATE TABLE IF NOT EXISTS domains (
     id uuid default uuid_generate_v4(),
     name varchar(255) NOT NULL UNIQUE,
     failed_links integer,
     PRIMARY KEY(id)
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
      weight real NOT NULL,
      place integer NOT NULL,
      country varchar(50),
      region varchar(50),
      relevance relevancy default 'text',
      PRIMARY KEY (id)
  );
`;

module.exports = {
  initQuery,
};
