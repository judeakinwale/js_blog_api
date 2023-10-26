const express = require("express");
// const {
//   createUser,
//   login,
//   getMe,
//   getUsers,
//   getUser,
//   updateUser,
//   updateProfile,
//   deleteUser,
//   forgotPassword,
//   resetPassword,
//   newPassword,

//   activateSelf,
//   uploadPhoto,
//   activateUser,
//   deactivateUser,
//   getTenantUsers,
//   getUserByEmail,
//   updateUserByEmail,
//   postUserDetails,
//   inviteUser,
//   minimalLogin,
//   loginOrCreate,
//   updateAllUserCourseEnrollment,
//   getMeByEmail,
//   updateProfileByEmail,
// } = require("../controllers/Auth");
// const User = require("../models/User");
// const { protect, authorize } = require("../middleware/auth");
// const advancedResults = require("../middleware/advancedResults");
const router = express.Router();

// router.route("/").post(createUser).get(advancedResults(User), getUsers);

// router.route("/tenant").post(getTenantUsers);

// router.route("/login").post(login);

// router.route("/ad").post(postUserDetails); // login or create account using MS graph
// router.route("/invite").post(inviteUser); // login or create account using MS graph

// router.route("/login/create").post(loginOrCreate);
// router.route("/login/min").post(minimalLogin);
// router.route("/login/ad").post(postUserDetails);

// router.route("/enroll/all").post(updateAllUserCourseEnrollment);

// // Move /me route after /:id route
// router.route("/me").get(protect, getMe).put(protect, updateProfile);
// router.route("/me/email/:email").get(getMeByEmail).put(updateProfileByEmail);

// router.post("/forgotpassword", forgotPassword);
// router.put("/resetpassword/:resettoken", resetPassword);
// router.put("/newpassword", protect, newPassword);

// router
//   .route("/:id")
//   .delete(protect, authorize("SuperAdmin"), deleteUser)
//   .get(getUser)
//   .put(updateUser);

// router.route("email/:email").get(getUserByEmail).put(updateUserByEmail);

// router.route("/activate/:token").get(activateSelf);
// router.route("/:id/photo").post(uploadPhoto);
// router.route("/:id/activate").patch(activateUser);
// router.route("/:id/deactivate").patch(deactivateUser);

module.exports = router;
