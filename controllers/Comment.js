const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Comment = require("../models/Comment");
const { updateMetaData, sortArrayOfObjects } = require("../utils/utils");
const { audit } = require("../utils/auditUtils");

exports.populateComment = [{}];

// @desc    Create Comment/
// @route   POST  /api/v1/comment/
// @access   Public
exports.createComment = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id);

  // const data = await Comment.create(req.body);
  const { post, author, parent } = req.body;
  const data = await Comment.findOneAndUpdate(
    { post, author, parent },
    req.body,
    {
      new: true,
      runValidators: true,
      upsert: true,
    }
  );
  if (!data) return next(new ErrorResponse(`Comment not found!`, 404));

  await audit.create(req.user, "Comment");
  res.status(201).json({
    success: true,
    data,
  });
});

// @desc    Get All Comment
// @route   POST  /api/v1/comment/
// @access   Private/Admin
exports.getComments = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get Single Comment
// @route   GET /api/v1/comment/:id
// @access   Private/Admin
exports.getComment = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Comment Id not provided`, 400));

  let data = await Comment.findById(id);
  if (!data) return next(new ErrorResponse(`Comment not found!`, 404));

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Update Comment
// @route   PATCH api/v1/comment/:id
// @access   Private
exports.updateComment = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Comment Id not provided`, 400));

  const data = await Comment.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) return next(new ErrorResponse(`Comment not found!`, 404));

  await audit.update(req.user, "Comment", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Delete Comment
// @route   DELTE /api/v1/comment/:id
// @access   Private/Admin
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Comment Id not provided`, 400));

  const data = await Comment.findByIdAndDelete(id);
  if (!data) return next(new ErrorResponse(`Comment not found!`, 404));

  await audit.delete(req.user, "Comment", data?._id);
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get popular Comments
// @route   GET /api/v1/comment/popular/?:postId
// @access   Private/Admin
exports.getPopularComments = asyncHandler(async (req, res, next) => {
  const id = req.params.postId;
  const filter = id ? { post: id } : {};

  const comments = await Comment.find(filter);
  const data = sortArrayOfObjects(comments, "courses", "descending");

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});
