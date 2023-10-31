const express = require("express");
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  getPopularPosts,
  populatePost,
  likePost,
  unlikePost,
  removePostCategory,
  addPostCategory,
} = require("../controllers/Post");
const Post = require("../models/Post");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.route("/").post(createPost);
router.route("/").get(advancedResults(Post, populatePost), getPosts);
router.route("/popular").get(getPopularPosts);
router.route("/:id").get(getPost);
router.route("/:id").put(updatePost);
router.route("/:id").patch(updatePost);
router.route("/:id").delete(protect, authorize("SuperAdmin"), deletePost);
router.route("/:id/like").get(protect, likePost);
router.route("/:id/unlike").get(protect, unlikePost);
router.route("/:id/category/add").patch(protect, addPostCategory);
router.route("/:id/category/remove").patch(protect, removePostCategory);

module.exports = router;
