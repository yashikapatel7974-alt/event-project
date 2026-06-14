const assetRepository = require('../repositories/assetRepository');
const userRepository = require('../repositories/userRepository');
const employeeRepository = require('../repositories/employeeRepository');
const mailer = require('../utils/mailer');
const db = require('../config/db');

class AssetService {
  async getAssets(filters) {
    return assetRepository.getAssets(filters);
  }

  async getAssetById(id) {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      throw new Error('Asset not found.');
    }
    return asset;
  }

  async createAsset(assetData, creatorId = null) {
    const res = await assetRepository.queryWithContext(
      `INSERT INTO assets (name, serial_number, type, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [assetData.name, assetData.serial_number, assetData.type, assetData.status || 'Available'],
      creatorId
    );
    
    // Log history
    const asset = res.rows[0];
    await assetRepository.queryWithContext(
      `INSERT INTO asset_history (asset_id, action, performed_by, details)
       VALUES ($1, 'Created', $2, $3)`,
      [asset.id, creatorId, `Asset added to inventory: ${asset.name} (${asset.serial_number})`],
      creatorId
    );

    return asset;
  }

  async updateAsset(id, assetData, updaterId = null) {
    const existing = await assetRepository.findById(id);
    if (!existing) {
      throw new Error('Asset not found.');
    }

    const res = await assetRepository.queryWithContext(
      `UPDATE assets 
       SET name = COALESCE($1, name),
           serial_number = COALESCE($2, serial_number),
           type = COALESCE($3, type),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [assetData.name, assetData.serial_number, assetData.type, assetData.status, id],
      updaterId
    );
    const updatedAsset = res.rows[0];

    // Log history
    let changeDetails = 'Asset details updated:';
    if (assetData.name && assetData.name !== existing.name) changeDetails += ` Name changed to ${assetData.name};`;
    if (assetData.status && assetData.status !== existing.status) changeDetails += ` Status changed to ${assetData.status};`;

    await assetRepository.queryWithContext(
      `INSERT INTO asset_history (asset_id, action, performed_by, details)
       VALUES ($1, 'Updated', $2, $3)`,
      [id, updaterId, changeDetails],
      updaterId
    );

    return updatedAsset;
  }

  async deleteAsset(id, userId = null) {
    const existing = await assetRepository.findById(id);
    if (!existing) {
      throw new Error('Asset not found.');
    }
    if (existing.status === 'Allocated') {
      throw new Error('Cannot delete an allocated asset. Return it first.');
    }
    return assetRepository.delete(id, userId);
  }

  async allocateAsset(assetId, userId, allocatedBy, notes = '') {
    const allocation = await assetRepository.allocateAssetTx(assetId, userId, allocatedBy, notes);

    // Send email to assignee
    try {
      const user = await userRepository.findById(userId);
      const profile = await employeeRepository.getProfileByUserId(userId);
      const asset = await assetRepository.findById(assetId);

      await mailer.sendMail({
        to: user.email,
        subject: `New Asset Assigned - ${asset.name}`,
        text: `Hello ${profile.first_name},\n\nYou have been assigned the following IT asset:\nAsset Name: ${asset.name}\nSerial Number: ${asset.serial_number}\nAsset Type: ${asset.type}\nNotes: ${notes || 'N/A'}\n\nPlease take care of it.\n\nBest regards,\nIT Admin`,
        html: `<p>Hello <strong>${profile.first_name}</strong>,</p>
               <p>You have been assigned the following IT asset:</p>
               <ul>
                 <li><strong>Asset Name:</strong> ${asset.name}</li>
                 <li><strong>Serial Number:</strong> ${asset.serial_number}</li>
                 <li><strong>Asset Type:</strong> ${asset.type}</li>
                 <li><strong>Notes:</strong> ${notes || 'N/A'}</li>
               </ul>
               <p>Please review and confirm receipt.</p>
               <p>Best regards,<br/>IT Admin</p>`
      });
    } catch (err) {
      console.error('Failed to send asset allocation email notification:', err.message);
    }

    return allocation;
  }

  async returnAsset(assetId, returnedBy, notes = '') {
    return assetRepository.returnAssetTx(assetId, returnedBy, notes);
  }

  async getAssetAllocationsAndHistory(assetId) {
    const allocations = await assetRepository.getAssetAllocations(assetId);
    const history = await assetRepository.getAssetHistory(assetId);
    return { allocations, history };
  }
}

module.exports = new AssetService();
