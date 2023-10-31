const express = require("express");
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getPopularCategories,
  populateCategory,
} = require("../controllers/Category");
const Category = require("../models/Category");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.route("/").post(createCategory);
router.route("/").get(advancedResults(Category, populateCategory), getCategories);
router.route("/popular").get(getPopularCategories);
router.route("/:id").get(getCategory);
router.route("/:id").patch(updateCategory);
router.route("/:id").put(updateCategory);
router.route("/:id").delete(protect, authorize("SuperAdmin"), deleteCategory);

module.exports = router;
