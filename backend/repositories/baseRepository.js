const db = require('../config/db');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Helper to run query with optional session context (for audit trail)
  async queryWithContext(text, params = [], userId = null) {
    const client = await db.pool.connect();
    try {
      if (userId) {
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
      }
      const res = await client.query(text, params);
      return res;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const res = await db.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findAll() {
    const res = await db.query(`SELECT * FROM ${this.tableName}`);
    return res.rows;
  }

  async delete(id, userId = null) {
    const res = await this.queryWithContext(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
      [id],
      userId
    );
    return res.rows[0] || null;
  }
}

module.exports = BaseRepository;
