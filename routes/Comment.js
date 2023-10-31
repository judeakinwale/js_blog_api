const express = require("express");
const {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
  getPopularComments,
  populateComment,
  likeComment,
  unlikeComment,
} = require("../controllers/Comment");
const Comment = require("../models/Comment");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.route("/").post(createComment);
router.route("/").get(advancedResults(Comment, populateComment), getComments);
router.route("/popular").get(getPopularComments);
router.route("/:id").get(getComment);
router.route("/:id").put(updateComment);
router.route("/:id").patch(updateComment);
router.route("/:id").delete(protect, authorize("SuperAdmin"), deleteComment);
router.route("/:id/like").get(protect, likeComment);
router.route("/:id/unlike").get(protect, unlikeComment);

module.exports = router;
