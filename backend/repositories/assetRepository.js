const BaseRepository = require('./baseRepository');
const db = require('../config/db');

class AssetRepository extends BaseRepository {
  constructor() {
    super('assets');
  }

  async getAssets({ page = 1, limit = 10, search = '', status = '', type = '' }) {
    const offset = (page - 1) * limit;
    let baseQuery = `FROM assets WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      baseQuery += ` AND (name ILIKE $${params.length} OR serial_number ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      baseQuery += ` AND status = $${params.length}`;
    }

    if (type) {
      params.push(type);
      baseQuery += ` AND type = $${params.length}`;
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

  async allocateAssetTx(assetId, userId, allocatedBy, notes = '') {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [allocatedBy]);

      // Check asset availability
      const assetRes = await client.query(
        `SELECT * FROM assets WHERE id = $1 FOR UPDATE`,
        [assetId]
      );
      const asset = assetRes.rows[0];

      if (!asset) {
        throw new Error('Asset not found.');
      }
      if (asset.status !== 'Available') {
        throw new Error(`Asset is not available for allocation. Current status: ${asset.status}`);
      }

      // Update asset status
      await client.query(
        `UPDATE assets SET status = 'Allocated' WHERE id = $1`,
        [assetId]
      );

      // Create allocation record
      const allocRes = await client.query(
        `INSERT INTO asset_allocations (asset_id, user_id, allocated_by, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [assetId, userId, allocatedBy, notes]
      );

      // Log asset history
      await client.query(
        `INSERT INTO asset_history (asset_id, action, performed_by, details)
         VALUES ($1, 'Allocated', $2, $3)`,
        [assetId, allocatedBy, `Allocated to user ID: ${userId}. Notes: ${notes}`]
      );

      // Notify user
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         VALUES ($1, $2, $3)`,
        [
          userId,
          'New Asset Allocated',
          `You have been allocated the asset: ${asset.name} (${asset.serial_number}).`
        ]
      );

      await client.query('COMMIT');
      return allocRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async returnAssetTx(assetId, returnedBy, notes = '') {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [returnedBy]);

      // Find active allocation
      const allocRes = await client.query(
        `SELECT * FROM asset_allocations 
         WHERE asset_id = $1 AND returned_at IS NULL 
         ORDER BY allocated_at DESC LIMIT 1 FOR UPDATE`,
        [assetId]
      );
      const allocation = allocRes.rows[0];

      if (!allocation) {
        throw new Error('No active allocation record found for this asset.');
      }

      // Update allocation record (returned_at)
      await client.query(
        `UPDATE asset_allocations 
         SET returned_at = CURRENT_TIMESTAMP, notes = COALESCE($1, notes) 
         WHERE id = $2`,
        [notes ? `${allocation.notes} | Return Notes: ${notes}` : allocation.notes, allocation.id]
      );

      // Update asset status
      await client.query(
        `UPDATE assets SET status = 'Available' WHERE id = $1`,
        [assetId]
      );

      // Log asset history
      await client.query(
        `INSERT INTO asset_history (asset_id, action, performed_by, details)
         VALUES ($1, 'Returned', $2, $3)`,
        [assetId, returnedBy, `Returned by user ID: ${allocation.user_id}. Notes: ${notes}`]
      );

      // Notify user
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         VALUES ($1, $2, $3)`,
        [
          allocation.user_id,
          'Asset Returned',
          `The allocated asset has been marked as returned.`
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getAssetAllocations(assetId) {
    const res = await db.query(
      `SELECT aa.*, ep.first_name, ep.last_name, u.email 
       FROM asset_allocations aa 
       JOIN users u ON aa.user_id = u.id 
       JOIN employee_profiles ep ON u.id = ep.user_id 
       WHERE aa.asset_id = $1 
       ORDER BY aa.allocated_at DESC`,
      [assetId]
    );
    return res.rows;
  }

  async getAssetHistory(assetId) {
    const res = await db.query(
      `SELECT ah.*, ep.first_name, ep.last_name 
       FROM asset_history ah 
       LEFT JOIN users u ON ah.performed_by = u.id 
       LEFT JOIN employee_profiles ep ON u.id = ep.user_id 
       WHERE ah.asset_id = $1 
       ORDER BY ah.created_at DESC`,
      [assetId]
    );
    return res.rows;
  }
}

module.exports = new AssetRepository();
