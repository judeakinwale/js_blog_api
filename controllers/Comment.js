const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Comment = require("../models/Comment");
const { updateMetaData, sortArrayOfObjects } = require("../utils/utils");
const { audit } = require("../utils/auditUtils");
const { upsertOptions, updateOptions } = require("../utils/mongooseUtils");
const Post = require("../models/Post");

exports.populateComment = [
  {
    path: "children",
    populate: {
      path: "children",
      populate: {
        path: "children",
        populate: { path: "children" },
      },
    },
  },
];

// @desc    Create Comment/
// @route   POST  /api/v1/comment/
// @access   Public
exports.createComment = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id);

  // const data = await Comment.create(req.body);
  const { post, email, parent } = req.body;
  const data = await Comment.findOneAndUpdate(
    { post, email, parent },
    req.body,
    {
      new: true,
      runValidators: true,
      upsert: true,
    }
  );
  if (!data) return next(new ErrorResponse(`Comment not found!`, 404));

  // update parent comment
  if (data.parent) {
    const parentComment = await Comment.findByIdAndUpdate(data.parent, {
      $push: { children: data },
    });
    if (!parentComment)
      return next(new ErrorResponse(`Parent Comment not found!`, 404));
  }

  // update comments in related post
  if (data.post) {
    const relatedPost = await Post.findByIdAndUpdate(data.post, {
      $push: { comments: data },
    });
    if (!relatedPost)
      return next(new ErrorResponse(`Related Post not found!`, 404));
  }

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

  let data = await Comment.findById(id).populate(this.populateComment);
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

  const data = await Comment.findByIdAndUpdate(id, req.body, updateOptions).populate(this.populateComment);
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

  const comments = await Comment.find(filter).populate(this.populateComment);
  const data = sortArrayOfObjects(comments, "likes", "descending");

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});

// @desc    Like Comment
// @route   GET api/v1/comment/:id/like
// @access   Private
exports.likeComment = asyncHandler(async (req, res, next) => {
  // updateMetaData(req.body, req.user?._id, true);
  updateMetaData(req.body, undefined, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Comment Id not provided`, 400));

  const data = await Comment.findByIdAndUpdate(
    id,
    {
      $addToSet: { likes: req.user?._id },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(this.populateComment);
  if (!data) return next(new ErrorResponse(`Comment not found!`, 404));

  // await audit.update(req.user, "Comment", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Unlike Comment
// @route   GET api/v1/comment/:id/unlike
// @access   Private
exports.unlikeComment = asyncHandler(async (req, res, next) => {
  // updateMetaData(req.body, req.user?._id, true);
  updateMetaData(req.body, undefined, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Comment Id not provided`, 400));

  const data = await Comment.findByIdAndUpdate(
    id,
    {
      $pull: { likes: req.user?._id },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(this.populateComment);
  if (!data) return next(new ErrorResponse(`Comment not found!`, 404));

  // await audit.update(req.user, "Comment", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});
