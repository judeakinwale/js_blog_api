// const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Category = require("../models/Category");
const {
  updateMetaData,
  sortArrayOfObjects,
} = require("../utils/utils");
const { audit } = require("../utils/auditUtils");

exports.populateCategory = "";

// @desc    Create Category/
// @route   POST  /api/v1/category/
// @access   Public
exports.createCategory = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id);

  // const data = await Category.create(req.body);
  const { title, author } = req.body;
  const data = await Category.findOneAndUpdate({ title, author }, req.body, {
    new: true,
    runValidators: true,
    upsert: true,
  });
  if (!data) return next(new ErrorResponse(`Category not found!`, 404));

  await audit.create(req.user, "Category");
  res.status(201).json({
    success: true,
    data,
  });
});

// @desc    Get All Category
// @route   POST  /api/v1/category/
// @access   Private/Admin
exports.getCategories = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get Single Category
// @route   GET /api/v1/category/:id
// @access   Private/Admin
exports.getCategory = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Category Id not provided`, 400));

  let data = await Category.findById(id).populate(this.populateCategory);
  if (!data) return next(new ErrorResponse(`Category not found!`, 404));

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Update Category
// @route   PATCH api/v1/category/:id
// @access   Private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Category Id not provided`, 400));

  const data = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate(this.populateCategory);
  if (!data) return next(new ErrorResponse(`Category not found!`, 404));

  await audit.update(req.user, "Category", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Delete Category
// @route   DELTE /api/v1/category/:id
// @access   Private/Admin
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Category Id not provided`, 400));

  const data = await Category.findByIdAndDelete(id);
  if (!data) return next(new ErrorResponse(`Category not found!`, 404));

  await audit.delete(req.user, "Category", data?._id);
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get popular Categories
// @route   GET /api/v1/category/popular
// @access   Private/Admin
exports.getPopularCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find().populate(this.populateCategory);
  const data = sortArrayOfObjects(categories, "posts", "descending");

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});
