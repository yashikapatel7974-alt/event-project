const assetService = require('../services/assetService');
const { AppError } = require('../middleware/errorHandler');

const getAssets = async (req, res, next) => {
  try {
    const { page, limit, search, status, type } = req.query;
    const assetsData = await assetService.getAssets({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      search: search || '',
      status: status || '',
      type: type || '',
    });

    return res.status(200).json({
      status: 'success',
      data: assetsData,
    });
  } catch (error) {
    next(error);
  }
};

const getAssetDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await assetService.getAssetById(id);
    const { allocations, history } = await assetService.getAssetAllocationsAndHistory(id);

    return res.status(200).json({
      status: 'success',
      data: {
        asset,
        allocations,
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user.id);
    return res.status(201).json({
      status: 'success',
      data: { asset },
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await assetService.updateAsset(id, req.body, req.user.id);
    return res.status(200).json({
      status: 'success',
      data: { asset },
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    await assetService.deleteAsset(id, req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Asset deleted successfully.',
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

const allocateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, notes } = req.body;

    const allocation = await assetService.allocateAsset(id, userId, req.user.id, notes);
    return res.status(200).json({
      status: 'success',
      message: 'Asset allocated successfully.',
      data: { allocation },
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

const returnAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await assetService.returnAsset(id, req.user.id, notes);
    return res.status(200).json({
      status: 'success',
      message: 'Asset returned successfully.',
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

module.exports = {
  getAssets,
  getAssetDetails,
  createAsset,
  updateAsset,
  deleteAsset,
  allocateAsset,
  returnAsset,
};
