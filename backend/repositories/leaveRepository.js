const BaseRepository = require('./baseRepository');
const db = require('../config/db');

class LeaveRepository extends BaseRepository {
  constructor() {
    super('leave_applications');
  }

  async getBalancesByUserId(userId) {
    const res = await db.query(
      `SELECT lb.*, lt.name AS leave_type_name, lt.days_allowed 
       FROM leave_balance lb 
       JOIN leave_types lt ON lb.leave_type_id = lt.id 
       WHERE lb.user_id = $1`,
      [userId]
    );
    return res.rows;
  }

  async getApplications({ page = 1, limit = 10, userId = '', status = '', departmentName = '' }) {
    const offset = (page - 1) * limit;
    let baseQuery = `FROM v_leave_summary WHERE 1=1`;
    const params = [];

    if (userId) {
      params.push(userId);
      baseQuery += ` AND user_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      baseQuery += ` AND status = $${params.length}`;
    }

    if (departmentName) {
      params.push(departmentName);
      baseQuery += ` AND department_name = $${params.length}`;
    }

    // Total Count
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Data
    const queryParams = [...params, limit, offset];
    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    const dataRes = await db.query(dataQuery, queryParams);

    return { total, data: dataRes.rows };
  }

  async createApplicationTx({ userId, leaveTypeId, startDate, endDate, reason }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);

      // Calculate leave duration (inclusive)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (duration <= 0) {
        throw new Error('End date must be after or equal to start date.');
      }

      // Check balance
      const balRes = await client.query(
        `SELECT * FROM leave_balance WHERE user_id = $1 AND leave_type_id = $2 FOR UPDATE`,
        [userId, leaveTypeId]
      );
      const balance = balRes.rows[0];

      if (!balance) {
        throw new Error('Leave balance not initialized for this user and leave type.');
      }

      const available = balance.allocated_days - balance.used_days - balance.pending_days;
      if (available < duration) {
        throw new Error(`Insufficient leave balance. Requested: ${duration}, Available: ${available}`);
      }

      // Update pending days in balance
      await client.query(
        `UPDATE leave_balance 
         SET pending_days = pending_days + $1 
         WHERE user_id = $2 AND leave_type_id = $3`,
        [duration, userId, leaveTypeId]
      );

      // Create leave application
      const appRes = await client.query(
        `INSERT INTO leave_applications (user_id, leave_type_id, start_date, end_date, reason, status)
         VALUES ($1, $2, $3, $4, $5, 'Pending')
         RETURNING *`,
        [userId, leaveTypeId, startDate, endDate, reason]
      );

      await client.query('COMMIT');
      return appRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async processApplicationTx(applicationId, approverId, { action, comments }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [approverId]);

      // Fetch the application
      const appRes = await client.query(
        `SELECT * FROM leave_applications WHERE id = $1 FOR UPDATE`,
        [applicationId]
      );
      const application = appRes.rows[0];

      if (!application) {
        throw new Error('Leave application not found.');
      }

      if (application.status !== 'Pending') {
        throw new Error(`Leave application already processed. Current status: ${application.status}`);
      }

      const start = new Date(application.start_date);
      const end = new Date(application.end_date);
      const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Update application status
      const updatedAppRes = await client.query(
        `UPDATE leave_applications 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [action, applicationId]
      );

      // Log to approval history
      await client.query(
        `INSERT INTO approval_history (application_id, approver_id, action, comments)
         VALUES ($1, $2, $3, $4)`,
        [applicationId, approverId, action, comments]
      );

      // Adjust leave balance
      if (action === 'Approved') {
        // Transfer from pending_days to used_days
        await client.query(
          `UPDATE leave_balance 
           SET pending_days = pending_days - $1,
               used_days = used_days + $1 
           WHERE user_id = $2 AND leave_type_id = $3`,
          [duration, application.user_id, application.leave_type_id]
        );
      } else if (action === 'Rejected') {
        // Release pending_days
        await client.query(
          `UPDATE leave_balance 
           SET pending_days = pending_days - $1 
           WHERE user_id = $2 AND leave_type_id = $3`,
          [duration, application.user_id, application.leave_type_id]
        );
      }

      // Add a notification for the employee
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         VALUES ($1, $2, $3)`,
        [
          application.user_id,
          `Leave Request ${action}`,
          `Your leave request from ${application.start_date.toISOString().split('T')[0]} to ${application.end_date.toISOString().split('T')[0]} has been ${action.toLowerCase()}.`
        ]
      );

      await client.query('COMMIT');
      return updatedAppRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getLeaveTypes() {
    const res = await db.query('SELECT * FROM leave_types ORDER BY name ASC');
    return res.rows;
  }
}

module.exports = new LeaveRepository();
