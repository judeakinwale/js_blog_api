const path = require("path");
const crypto = require("crypto");
// const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
// const verifyEmailServer = require("../utils/verifyEmailServer");
// const { activateAccountEmail } = require("../utils/emailUtils");
// const { updateMetaData } = require("../utils/utils");
// const Tenant = require("../models/Tenant");
const { audit } = require("../utils/auditUtils");


// @desc    Get Single User By Email
// @route   POST/api/v1/auth/user/:email
// @access   Private/Admin
exports.getUserByEmail = asyncHandler(async (req, res, next) => {
  const email = req.params.email?.toLowerCase();
  if (!email) return next(new ErrorResponse(`Email not provided`, 401));

  const data = await User.find({ email });

  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Update User By Email
// @route   PUT/api/v1/auth/user/:email
// @access   Private
exports.updateUserByEmail = asyncHandler(async (req, res, next) => {
  const email = req.params.email?.toLowerCase();
  if (!email) return next(new ErrorResponse(`User Id not provided`, 400));

  const data = await User.findOneAndUpdate({ email }, req.body, {
    new: true,
    runValidators: true,
  });
  await audit.update(req.user, "User", data?._id);
  res.status(200).json({
    success: true,
    data,
  });
});

// @desc    Update User Photo
// @route   PATCH /api/v1/auth/:id/photo
// @access   Private
exports.uploadPhoto = asyncHandler(async (req, res, next) => {
  const userId = req.params.id ?? req.user?._id;
  if (!userId) return next(new ErrorResponse(`User Id not provided`, 400));

  const data = await User.findById(userId);

  if (!req.files) {
    return next(new ErrorResponse(`Please Upload a picture`, 400));
  }

  const file = req.files.photo;

  //Make sure the image is a photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please Upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please Upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  //crete custom filename
  file.name = `photo_${data._id}${path.parse(file.name).ext}`;

  file.mv(
    `${process.env.FILE_UPLOAD_PATH}/profile/${file.name}`,
    async (err) => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse(`An error occured while uploading`, 500));
      }
    }
  );
  await User.findByIdAndUpdate(userId, {
    photo: `${process.env.FILE_UPLOAD_PATH}/profile/${file.name}`,
  });
  res.status(200).json({
    success: true,
    data: file.name,
  });
});

// @desc    Activate User
// @route   GET /api/v1/auth/activate/:token
// @access   Private
// exports.activateUser = asyncHandler(async (req, res, next) => {
exports.activateSelf = asyncHandler(async (req, res, next) => {
  console.log("Activation Started");
  if (!req.params.token)
    return next(new ErrorResponse(`Activation token not provided`, 401));

  //get hashed token
  const activationToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    activationToken,
    activationExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }
  // set is active
  user.isActive = true;
  user.activationToken = undefined;
  user.activationExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Login User
// @route   POST/api/v1/auth/login
// @access   Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please Provide an email and password", 400));
  }
  //check for user
  const user = await User.findOne({
    email: email,
  }).select("+password");
  if (user?.loginAttempts?.length >= 5) {
    return next(
      new ErrorResponse(
        "Sorry your account has been locked, kindly contact your administrator",
        401
      )
    );
  }

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  //check if password match
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    const date = new Date();
    const attempts = user?.loginAttempts;
    attempts.push(date);
    await User.findByIdAndUpdate(
      user._id,
      { loginAttempts: attempts },
      {
        new: true,
        runValidators: true,
      }
    );
    if (attempts.length === 1) {
      return next(
        new ErrorResponse("Invalid credentials, 4 Attempts left", 401)
      );
    }
    if (attempts.length === 2) {
      return next(
        new ErrorResponse("Invalid credentials, 3 Attempts left", 401)
      );
    }
    if (attempts.length === 3) {
      return next(
        new ErrorResponse("Invalid credentials, 2 Attempts left", 401)
      );
    }
    if (attempts.length === 4) {
      return next(
        new ErrorResponse("Invalid credentials, 1 Attempts left", 401)
      );
    }
    if (attempts.length >= 5) {
      return next(
        new ErrorResponse(
          "Sorry your account has been locked, kindly contact your administrator",
          401
        )
      );
    }
  }

  if (user.invited === true) {
    // sendInvitedResponse(user, 200, res);
  } else {
    const attempts = user?.loginAttempts;
    if (attempts.length > 0) {
      await User.findByIdAndUpdate(
        user._id,
        { loginAttempts: [] },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    await audit.login(user);
    sendTokenResponse(user, 200, res, user?.invited);
  }
});

// @desc    Log user out / clear cookie
// @route  GET /api/v1/auth/logout
// @access   Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  // await audit.logout(user);
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Reset Password
// @route   PUT/api/v1/auth/resetpassword/:resettoken
// @access   Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }
  // set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save();

  await audit.login(user);
  sendTokenResponse(user, 200, res);
});

// @desc    Reset Password
// @route   PUT/api/v1/auth/resetpassword/:resettoken
// @access   Public
exports.newPassword = asyncHandler(async (req, res, next) => {
  //get hashed token
  const user = await User.findById(req.user?._id);
  if (!user) {
    return next(new ErrorResponse("User not ƒound", 404));
  }
  // set new password
  user.password = req.body.password;
  user.invited = false;
  await user.save();

  //Create reset url
  const resetUrl = `${req.protocol}://${req.get("host")}/app/profile`;

  const message = `<h1>Hi ${user.firstname}, </h1>
  <p> Your Password was reset was successful</p>
<p>Click on the button below to update your profile</p>
   <br />
 <a href="${resetUrl}" style="padding:1rem;color:black;background:#ff4e02;border-radius:5px;text-decoration:none;">Reset Password</a>`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset successful",
      content: message,
    });
    await audit.login(user);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    return next(new ErrorResponse("Email could not be sent", 500));
  }
});

// @desc    Forgot Password
// @route   POST/api/v1/auth/forgotpassword
// @access   Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }
  //Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  //Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/reset-password/${resetToken}`;

  const message = `<h1>Hi ${user.firstname}, </h1>
  <p> You are receiving this email because you (or someone else) has requested
the reset of a password</p>
<p>Click on the button below to reset your password</p>
   <br />
 <a href="${resetUrl}" style="padding:1rem;color:black;background:#ff4e02;border-radius:5px;text-decoration:none;">Reset Password</a>`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      content: message,
    });
    res
      .status(200)
      .json({ success: true, message: "Email Sent", data: resetToken });
  } catch (err) {
    console.log(err);
    user.getResetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse("Email could not be sent", 500));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// TODO: refactor this
// @desc    Invite User
// @route   POST/api/v1/auth/invite
// @access   Public
// exports.inviteUser = asyncHandler(async (req, res, next) => {
//   const tenantId = req.headers.tenant ?? req.body.tenant;
//   const user = await User.findOne({ email: req.body.email });

//   if (user) {
//     return next(new ErrorResponse("User already registered", 400));
//   }
//   if (!tenantId) {
//     return next(new ErrorResponse("Kindly provide Tenant Id", 400));
//   }

//   //Create reset url
//   // const resetUrl = `${req.protocol}://${req.get(
//   //   "host"
//   // )}/reset-password/${resetToken}`;

//   const tenant = await Tenant.findById(tenantId);
//   if (!tenant) {
//     return next(new ErrorResponse("Invalid Tenant Id provided!", 400));
//   }

//   const frontendBaseUrl = "http;//localhost";
//   const inviteUrl = `${frontendBaseUrl}/invited/${tenantId}`;

//   const message = `<h1>Hi </h1>
//   <p> You have been invited to the ${tenant.title} Cloud Learning Management System.</p>
// <p>Click on the button below to complete your account setup and access your dashboard</p>
//    <br />
//  <a href="${inviteUrl}" style="padding:1rem;color:black;background:#ff4e02;border-radius:5px;text-decoration:none;">Complete Account Creation</a>`;

//   try {
//     await sendEmail({
//       email: user.email,
//       subject: "Cloud Learning Portal Invitation",
//       content: message,
//     });
//     res
//       .status(200)
//       .json({ success: true, message: "Email Sent", data: inviteUrl });
//   } catch (err) {
//     // console.log(err);
//     // user.getResetPasswordToken = undefined;
//     // user.resetPasswordTokenExpire = undefined;
//     // await user.save({ validateBeforeSave: false });

//     return next(new ErrorResponse("Email could not be sent", 500));
//   }

//   res.status(200).json({
//     success: true,
//     data: tenant,
//   });
// });

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, isInvited = true) => {
  //create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    invited: isInvited,
    token,
    tenant: user?.tenant,
  });
};