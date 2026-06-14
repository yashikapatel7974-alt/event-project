const express = require('express');
const assetController = require('../controllers/assetController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateBody } = require('../validators/schemas');

const router = express.Router();

router.use(protect); // Require auth for all asset actions

// Admin, HR and Manager can view, but Employees can too (they need to see their own assets)
router.get('/', assetController.getAssets);
router.get('/:id', assetController.getAssetDetails);

// Only Admins and HR can add, update, delete or allocate assets
router.post('/', restrictTo('Admin', 'HR'), validateBody('createAsset'), assetController.createAsset);
router.put('/:id', restrictTo('Admin', 'HR'), validateBody('updateAsset'), assetController.updateAsset);
router.delete('/:id', restrictTo('Admin', 'HR'), assetController.deleteAsset);

router.post('/:id/allocate', restrictTo('Admin', 'HR'), validateBody('allocateAsset'), assetController.allocateAsset);
router.post('/:id/return', restrictTo('Admin', 'HR'), assetController.returnAsset);

module.exports = router;
