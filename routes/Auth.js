const express = require("express");
const {
  login,
  logout,
  forgotPassword,
  resetPassword,
  newPassword,
  activateSelf,
  uploadPhoto,
  getUserByEmail,
  updateUserByEmail,
  // inviteUser,
} = require("../controllers/Auth");
// const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();


router.route("/login").post(login);
router.route("/logout").post(logout);
// router.route("/invite").post(inviteUser); // invite a user


router.post("/forgotpassword", forgotPassword);
router.put("/newpassword", protect, newPassword);
router.put("/resetpassword/:resettoken", resetPassword);

router.route("/email/:email").get(getUserByEmail).put(updateUserByEmail);
router.route("/activate/:token").get(activateSelf);
router.route("/:id/photo").post(uploadPhoto);

module.exports = router;
