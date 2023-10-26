const express = require("express");
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  populateUser,
} = require("../controllers/User");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

router.route("/").post(createUser);
router.route("/").get(advancedResults(User, populateUser), getUsers);
router.route("/:id").get(getUser);
router.route("/:id").patch(updateUser);
router.route("/:id").delete(deleteUser);
// router.route("/:id").delete(protect, authorize("SuperAdmin"), deleteUser);

module.exports = router;
