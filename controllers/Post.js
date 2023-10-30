// const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Post = require("../models/Post");
const {
  updateMetaData,
  sortArrayOfObjects,
} = require("../utils/utils");
const { audit } = require("../utils/auditUtils");

exports.populatePost = [
  {
    path: "comments",
    populate: {
      path: "children",
      populate: {
        path: "children",
        populate: { path: "children" },
      },
    },
  },
];

// @desc    Create Post/
// @route   POST  /api/v1/post/
// @access   Public
exports.createPost = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id);

  // const data = await Post.create(req.body);
  const { title, author } = req.body;
  const data = await Post.findOneAndUpdate({ title, author }, req.body, {
    new: true,
    runValidators: true,
    upsert: true,
  });
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  await audit.create(req.user, "Post");
  res.status(201).json({
    success: true,
    data,
  });
});

// @desc    Get All Post
// @route   POST  /api/v1/post/
// @access   Private/Admin
exports.getPosts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get Single Post
// @route   GET /api/v1/post/:id
// @access   Private/Admin
exports.getPost = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Post Id not provided`, 400));

  let data = await Post.findById(id).populate(this.populatePost);
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Update Post
// @route   PATCH api/v1/post/:id
// @access   Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Post Id not provided`, 400));

  const data = await Post.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate(this.populatePost);
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  await audit.update(req.user, "Post", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Delete Post
// @route   DELTE /api/v1/post/:id
// @access   Private/Admin
exports.deletePost = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Post Id not provided`, 400));

  const data = await Post.findByIdAndDelete(id);
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  await audit.delete(req.user, "Post", data?._id);
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get popular Posts
// @route   GET /api/v1/post/popular
// @access   Private/Admin
exports.getPopularPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find().populate(this.populatePost);
  const data = sortArrayOfObjects(posts, "likes", "descending");

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});
