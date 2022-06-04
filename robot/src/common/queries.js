const initQuery = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS btree_gin;
  
  CREATE TABLE IF NOT EXISTS execution_statuses (
      status varchar(50) NOT NULL UNIQUE,
      description varchar(250) DEFAULT NULL
  );
  
  CREATE TABLE IF NOT EXISTS link_types (
      type varchar(50) NOT NULL UNIQUE,
      description varchar(250) DEFAULT NULL
  );
  
  CREATE TABLE IF NOT EXISTS geo_data (
      geo_id uuid DEFAULT uuid_generate_v4(),
      country varchar(50) UNIQUE NOT NULL,
      region varchar(50),
      UNIQUE (country, region),
      PRIMARY KEY (geo_id)
  );
  
  CREATE TABLE IF NOT EXISTS hosts (
     host_id uuid DEFAULT uuid_generate_v4(),
     name varchar(255) NOT NULL UNIQUE,
     links_count integer NOT NULL DEFAULT 0,
     failed_count integer NOT NULL DEFAULT 0,
     PRIMARY KEY(host_id)
  );
  
  CREATE TABLE IF NOT EXISTS token_types (
      type varchar(50) NOT NULL UNIQUE,
      description varchar(250) DEFAULT NULL
  );
  
  CREATE TABLE IF NOT EXISTS links (
      link_id uuid DEFAULT uuid_generate_v4(),
      url varchar(255) NOT NULL UNIQUE,
      title varchar(255),
      description varchar(255),
      preview_url varchar(255),
      internal_links_count integer DEFAULT 0,
      external_links_count integer DEFAULT 0,
      pre_rank real NOT NULL DEFAULT 0,
      link_geo_data uuid DEFAULT NULL,
      link_host_id uuid DEFAULT NULL,
      link_type varchar(50) NOT NULL,
      crawled_status varchar(50) NOT NULL,
      indexed_status varchar(50) NOT NULL,
      CONSTRAINT "FK_link-type"
          FOREIGN KEY (link_type) REFERENCES link_types(type),
      CONSTRAINT "FK_crawled-status"
          FOREIGN KEY (crawled_status) REFERENCES execution_statuses(status),
      CONSTRAINT "FK_indexed-status"
          FOREIGN KEY (indexed_status) REFERENCES execution_statuses(status),
      CONSTRAINT "FK_link-geo"
          FOREIGN KEY (link_geo_data) REFERENCES geo_data(geo_id),
      CONSTRAINT "FK_link-host"
          FOREIGN KEY (link_host_id) REFERENCES hosts(host_id),
      PRIMARY KEY (link_id)
  );
  
  CREATE TABLE IF NOT EXISTS indexes (
      index_id uuid DEFAULT uuid_generate_v4(),
      token varchar(100) NOT NULL,
      url varchar(255) NOT NULL,
      index_type varchar(50),
      weight real NOT NULL,
      place integer NOT NULL,
      UNIQUE (token, url, place),
      CONSTRAINT "FK_index-url"
          FOREIGN KEY (url) REFERENCES links(url),
      CONSTRAINT "FK_index-type"
          FOREIGN KEY (index_type) REFERENCES token_types(type),
      PRIMARY KEY (index_id)
  );
`;

module.exports = {
  initQuery,
};
