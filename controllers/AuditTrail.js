const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const AuditTrail = require("../models/AuditTrail");
const {
  updateMetaData,
} = require("../utils/utils");
const { audit } = require("../utils/auditUtils");

// @desc    Create AuditTrail/
// @route   POST  /api/v1/audit/
// @access   Public
exports.createAuditTrail = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id);

  const [data] = await Promise.all([
    await AuditTrail.create(req.body),
    await audit.create(req.user, "AuditTrail"),
  ]);
  if (!data) return next(new ErrorResponse(`AuditTrail not found!`, 404));

  res.status(201).json({
    success: true,
    data,
  });
});

// @desc    Get All AuditTrail
// @route   POST  /api/v1/audit/
// @access   Private/Admin
exports.getAuditTrails = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get Single AuditTrail
// @route   GET /api/v1/audit/:id
// @access   Private/Admin
exports.getAuditTrail = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`AuditTrail Id not provided`, 400));

  let data = await AuditTrail.findById(id);
  if (!data) return next(new ErrorResponse(`AuditTrail not found!`, 404));

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Update AuditTrail
// @route   PATCH api/v1/audit/:id
// @access   Private
exports.updateAuditTrail = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`AuditTrail Id not provided`, 400));

  const data = await AuditTrail.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) return next(new ErrorResponse(`AuditTrail not found!`, 404));

  await audit.update(req.user, "AuditTrail", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Delete AuditTrail
// @route   DELTE /api/v1/audit/:id
// @access   Private/Admin
exports.deleteAuditTrail = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`AuditTrail Id not provided`, 400));

  const data = await AuditTrail.findByIdAndDelete(id);
  if (!data) return next(new ErrorResponse(`AuditTrail not found!`, 404));

  await audit.delete(req.user, "AuditTrail", data?._id);
  res.status(200).json({
    success: true,
    data: {},
  });
});
