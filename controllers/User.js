// const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const { updateMetaData } = require("../utils/utils");
const { activateAccountEmail } = require("../utils/emailUtils");
const { audit } = require("../utils/auditUtils");

exports.populateUser = [{}];

// @desc    Create User/
// @route   POST/api/v1/user
// @access   Public
exports.createUser = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id);
  req.body.email = req.body.email && req.body.email?.toLowerCase();

  // check user account exists
  const existingData = await User.findOne({ email: req.body.email });
  if (existingData) return next(new ErrorResponse(`Account exists!`, 400));

  const data = await User.create(req.body).populate();
  if (!data) return next(new ErrorResponse(`User not found!`, 404));

  // notification for  signup
  const isEmailSent = await activateAccountEmail(req, res, data);
  const message = !isEmailSent ? "Email could not be sent" : undefined;

  await audit.create(req.user, "User");
  res.status(201).json({
    success: true,
    data,
    message,
  });
});

// @desc    Get All Users
// @route   POST/api/v1/user
// @access   Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get Single User
// @route   POST/api/v1/user/:id
// @access   Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id ?? req.user?._id;
  if (!id) return next(new ErrorResponse(`User Id not provided`, 400));

  let data = await User.findById(id).populate();
  if (!data) return next(new ErrorResponse(`User not found!`, 404));

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Update User
// @route   PUT/api/v1/user/:id
// @access   Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id ?? req.user?._id;
  if (!id) return next(new ErrorResponse(`User Id not provided`, 400));

  req.body.email = req.body.email && req.body.email?.toLowerCase();

  let data = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) return next(new ErrorResponse(`User not found!`, 404));

  await audit.update(req.user, "User", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Delete User
// @route   DELTE/api/v1/user/:id
// @access   Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id ?? req.user?._id;
  if (!id) return next(new ErrorResponse(`User Id not provided`, 400));

  const data = await User.findByIdAndDelete(id);
  if (!data) return next(new ErrorResponse(`User not found!`, 404));

  await audit.delete(req.user, "User", data?._id);
  res.status(200).json({
    success: true,
    data: {},
  });
});
