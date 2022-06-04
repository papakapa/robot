const { Repository } = require('../common/index');

class IndexesRepository extends Repository {
  constructor(connection) {
    super(connection, {
      index_id: 'indexId',
      token: 'token',
      url: 'url',
      index_type: 'indexType',
      weight: 'weight',
      place: 'place',
    }, 'indexes');
  }

  async find({ select = null, where = null } = {}) {
    return this.select({select, where});
  }
}

module.exports = {
  IndexesRepository,
};
