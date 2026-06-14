const BaseRepository = require('./baseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const res = await this.queryWithContext(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return res.rows[0] || null;
  }

  async createUser({ email, passwordHash, role, departmentId }, creatorId = null) {
    const res = await this.queryWithContext(
      `INSERT INTO users (email, password_hash, role, department_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, department_id, is_active, created_at`,
      [email, passwordHash, role, departmentId],
      creatorId
    );
    return res.rows[0];
  }

  async updateUserRole(id, role, updaterId = null) {
    const res = await this.queryWithContext(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [role, id],
      updaterId
    );
    return res.rows[0] || null;
  }

  async updateStatus(id, isActive, updaterId = null) {
    const res = await this.queryWithContext(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [isActive, id],
      updaterId
    );
    return res.rows[0] || null;
  }
}

module.exports = new UserRepository();
