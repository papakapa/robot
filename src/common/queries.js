const initQuery = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS btree_gin;
  
  CREATE TABLE IF NOT EXISTS links (
      id uuid default uuid_generate_v4(),
      url varchar(255) NOT NULL UNIQUE,
      title varchar(255),
      description varchar(255),
      country varchar(50),
      region varchar(50),
      internal_links_count integer default 0,
      external_links_count integer default 0,
      pre_rank real NOT NULL default 0,
      link_type link_type NOT NULL default 'default',
      is_crawled execution_status NOT NULL default 'pending',
      is_indexed execution_status NOT NULL default 'pending',
      PRIMARY KEY (id)
  );
  
  CREATE TABLE IF NOT EXISTS domains (
     id uuid default uuid_generate_v4(),
     name varchar(255) NOT NULL UNIQUE,
     PRIMARY KEY(id)
  );
  
  CREATE TABLE IF NOT EXISTS tokens (
      id uuid default uuid_generate_v4(),
      text varchar(255) NOT NULL UNIQUE,
      PRIMARY KEY (id)
  );
  
  CREATE TABLE IF NOT EXISTS indexes (
      id uuid default uuid_generate_v4(),
      token varchar(255) REFERENCES tokens(text),
      link_url varchar(255) REFERENCES links(url),
      weight real NOT NULL,
      position integer NOT NULL,
      relevance relevancy default 'text',
      PRIMARY KEY (id)
  );
`;

module.exports = {
  initQuery,
};
