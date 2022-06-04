class Repository {
  constructor(connection, columns, tableName) {
    this.connection = connection;
    this.tableName = tableName;
    this.columns = columns;
  }

  formatResultWithColumns(rows) {
      return rows.map(el => Object.keys(this.columns).
      reduce((acc, cur) => ({
        ...acc,
        ...(el.hasOwnProperty(cur)) && {[this.columns[cur]]: el[cur]}
      }), {})
      )
  }

  buildWhereParams(where = null) {
    return where ?
        'WHERE'.concat(Object.keys(where)
            .map((el, i) => ` ${el} = '${where[el]}' AND`).join(''))
            .replace(new RegExp('AND' + '$'), '')
        : ''
  }

  buildQuery(select = null, where = null) {
    return {
      selectParams: select ? Object.keys(select).reduce((acc, cur) => {
          return this.columns[cur] && select[cur] ? [...acc, cur] : acc;
          }, []).join() : '*',
      whereParams: this.buildWhereParams(where),
    };
  }

  buildUpdateQuery(fields, where = null) {
    return {
      updateFields: Object.keys(fields).map((el) => `${el} = ${Number(fields[el]) ? fields[el] : `'${fields[el]}'`}`).join(),
      whereParams: this.buildWhereParams(where),
    }
  }

  buildInsertQuery(fields) {
    return {
      insertFields: Object.keys(fields).join(),
      insertValues: Object.values(fields).map(el => Number(el) ? el: `'${el}'`).join(),
    }
  }

  async select({ select = null, where = null } = {}) {
    try {
      const { selectParams, whereParams } = this.buildQuery(select, where);
      const { rows } = await this.connection.query(`SELECT ${selectParams} FROM ${this.tableName} ${whereParams}`);

      if (!rows.length) {
        return [];
      }

      return this.formatResultWithColumns(rows);
    } catch(e) {
      console.log(e.message);

      return [];
    }
  }

  async update({ fields, where }) {
    try {
      const { whereParams, updateFields } = this.buildUpdateQuery(fields, where);

      await this.connection.query(`UPDATE ${this.tableName} SET ${updateFields} ${whereParams}`);
    } catch(e) {
      console.log(e.message);
    }
  }

  async insert({ fields }) {
    try {
      const { insertFields, insertValues } = this.buildInsertQuery(fields);

      await this.connection.query(`INSERT INTO ${this.tableName}(${insertFields}) VALUES(${insertValues})`);
    } catch(e) {
      console.log(e.message);
    }
  }

  async query(queryString) {
    try {
      const { rows } = await this.connection.query(queryString);

      return rows;
    } catch(e) {
      console.log(e.message);

      return null;
    }
  }
}

module.exports = { Repository };
