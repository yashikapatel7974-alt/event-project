const BaseRepository = require('./baseRepository');
const db = require('../config/db');

class EmployeeRepository extends BaseRepository {
  constructor() {
    super('employee_profiles');
  }

  async createProfile({ userId, firstName, lastName, phone, salary, hireDate, avatarUrl, documentUrls }, creatorId = null) {
    const res = await this.queryWithContext(
      `INSERT INTO employee_profiles (user_id, first_name, last_name, phone, salary, hire_date, avatar_url, document_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, firstName, lastName, phone, salary, hireDate, avatarUrl, documentUrls],
      creatorId
    );
    return res.rows[0];
  }

  async updateProfile(userId, { firstName, lastName, phone, salary, avatarUrl, documentUrls }, updaterId = null) {
    const res = await this.queryWithContext(
      `UPDATE employee_profiles 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           salary = COALESCE($4, salary),
           avatar_url = COALESCE($5, avatar_url),
           document_urls = COALESCE($6, document_urls),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $7
       RETURNING *`,
      [firstName, lastName, phone, salary, avatarUrl, documentUrls, userId],
      updaterId
    );
    return res.rows[0] || null;
  }

  async getDirectory({ page = 1, limit = 10, search = '', departmentId = '', role = '' }) {
    const offset = (page - 1) * limit;
    let baseQuery = `FROM v_employee_directory WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      baseQuery += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    if (departmentId) {
      params.push(departmentId);
      baseQuery += ` AND department_id = $${params.length}`;
    }

    if (role) {
      params.push(role);
      baseQuery += ` AND role = $${params.length}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Get paginated directory data
    const queryParams = [...params, limit, offset];
    const dataQuery = `SELECT * ${baseQuery} ORDER BY first_name ASC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    const dataRes = await db.query(dataQuery, queryParams);

    return { total, data: dataRes.rows };
  }

  async getProfileByUserId(userId) {
    const res = await db.query(`SELECT * FROM v_employee_directory WHERE user_id = $1`, [userId]);
    return res.rows[0] || null;
  }

  // Sync Skills many-to-many (in a transaction helper)
  async updateSkills(userId, skillNames, updaterId = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      if (updaterId) {
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [updaterId]);
      }

      // Delete existing skill mappings
      await client.query(`DELETE FROM employee_skills WHERE employee_id = $1`, [userId]);

      if (skillNames && skillNames.length > 0) {
        for (const name of skillNames) {
          // Upsert skill
          const skillRes = await client.query(
            `INSERT INTO skills (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
            [name]
          );
          const skillId = skillRes.rows[0].id;
          
          // Map skill to employee
          await client.query(
            `INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, skillId]
          );
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new EmployeeRepository();
