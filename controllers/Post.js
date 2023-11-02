// const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Post = require("../models/Post");
const { updateMetaData, sortArrayOfObjects } = require("../utils/utils");
const { audit } = require("../utils/auditUtils");
const { upsertOptions, updateOptions } = require("../utils/mongooseUtils");
const Category = require("../models/Category");
const { uploadBlob } = require("../utils/fileUtils");
const { isValidObjectId } = require("mongoose");

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
  const message = [];

  if (req.files)
    req.body.images = await uploadBlob(req, req.files, "images", "blog");

  // handle for formdata and application/json
  const categories = req.body.categories || req.body["category[]"];

  // validate category in categories is a valid objectId
  const categoriesWithValidObjectId = [];
  if (categories?.length > 0) {
    for (let i = 0; i < categories.length; i++) {
      console.log({ i });
      if (!isValidObjectId(categories[i])) {
        message.push("Invalid ObjectId provided as category Id at index: " + i);
        continue;
      }
      categoriesWithValidObjectId.push(categories[i]);
    }
  }

  // set req.body.categories to valid categories
  req.body.categories = categoriesWithValidObjectId;
  console.log({ categories: req.body.categories });

  // const data = await Post.create(req.body);
  const { title, author } = req.body;
  let data = await Post.findOneAndUpdate(
    { title, author },
    req.body,
    upsertOptions
  );
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  // update posts in categories (date.categories) and validate categories in post
  // TODO: update this
  if (data.categories.length > 0) {
    await Promise.all(
      data.categories.map(async (cat) => {
        try {
          const updatedCat = await Category.findByIdAndUpdate(cat, {
            $addToSet: { posts: data._id },
          });
          if (!updatedCat) {
            data = await Post.findByIdAndUpdate(
              data._id,
              {
                $pull: { categories: cat },
              },
              updateOptions
            );
            // return next(new ErrorResponse(`Related Post not found!`, 404));
            const errMsg = "Removed non existent category from post";
            console.log(errMsg);
            message.push(errMsg);
          }
        } catch (error) {
          const errMsg =
            "Updating category or removing invalid category failed";
          console.log(errMsg);
          message.push(errMsg);
        }
      })
    );
  }

  await audit.create(req.user, "Post");
  res.status(201).json({
    success: true,
    data,
    message,
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

  if (req.files)
    req.body.images = await uploadBlob(req, req.files, "images", "blog");

  const data = await Post.findByIdAndUpdate(
    id,
    req.body,
    updateOptions
  ).populate(this.populatePost);
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

// @desc    Like Post
// @route   GET api/v1/post/:id/like
// @access   Private
exports.likePost = asyncHandler(async (req, res, next) => {
  // updateMetaData(req.body, req.user?._id, true);
  updateMetaData(req.body, undefined, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Post Id not provided`, 400));

  const data = await Post.findByIdAndUpdate(
    id,
    {
      $addToSet: { likes: req.user?._id },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(this.populatePost);
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  // await audit.update(req.user, "Post", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Unlike Post
// @route   GET api/v1/post/:id/unlike
// @access   Private
exports.unlikePost = asyncHandler(async (req, res, next) => {
  // updateMetaData(req.body, req.user?._id, true);
  updateMetaData(req.body, undefined, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Post Id not provided`, 400));

  const data = await Post.findByIdAndUpdate(
    id,
    {
      $pull: { likes: req.user?._id },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(this.populatePost);
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  // await audit.update(req.user, "Post", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Add Post Category
// @route   GET api/v1/post/:id/category/add
// @access   Private
exports.addPostCategory = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id, true);
  // updateMetaData(req.body, undefined, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Post Id not provided`, 400));

  const data = await Post.findByIdAndUpdate(
    id,
    {
      $addToSet: { categories: { $each: req.body.categories } },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(this.populatePost);
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  await audit.update(req.user, "Post", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Remove Post Categories
// @route   GET api/v1/post/:id/category/remove
// @access   Private
exports.removePostCategory = asyncHandler(async (req, res, next) => {
  updateMetaData(req.body, req.user?._id, true);
  // updateMetaData(req.body, undefined, true);

  const id = req.params.id;
  if (!id) return next(new ErrorResponse(`Post Id not provided`, 400));

  const data = await Post.findByIdAndUpdate(
    id,
    {
      $pull: { categories: { $each: req.body.categories } },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate(this.populatePost);
  if (!data) return next(new ErrorResponse(`Post not found!`, 404));

  await audit.update(req.user, "Post", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});
