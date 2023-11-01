const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const verifyEmailServer = require("../utils/verifyEmailServer");
const { activateAccountEmail } = require("../utils/emailUtils");
const { updateMetaData } = require("../utils/utils");
const {
  getUserDetails,
  enrollUserToAllCourses,
  enrollAllUsersToAllCourses,
  userTenantSubscriptionCheck,
  userTenantPostCreationLogic,
} = require("../utils/userUtils");
const Tenant = require("../models/Tenant");
const { getTenantByEmail } = require("../utils/tenantUtils");
const { audit } = require("../utils/auditUtils");
const { upsertOptions, updateOptions } = require("../utils/mongooseUtils");

// TODO: refactor file

//Register new users and send a token
exports.postUserDetails = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res
      .status(400)
      .json({ success: false, msg: "No access token provided" });
  }
  const config = {
    method: "get",
    url: "https://graph.microsoft.com/v1.0/me",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const photoConfig = {
    method: "get",
    url: "https://graph.microsoft.com/v1.0/me/photo/$value",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    responseType: "arraybuffer",
  };

  try {
    // const photo = await axios(photoConfig); //get user data from active directory
    // const avatar = new Buffer.from(photo.data, "binary").toString("base64");

    const { data } = await axios(config); //get user data from active directory

    const checkEmail = data.mail.split("@"); //split the email address
    // if (
    //   checkEmail[1] !== "lotusbetaanalytics.com" ||
    //   !checkEmail.includes("lotusbetaanalytics.com") //check if the email address has lotusbetaanalytics.com domain
    // ) {
    //   return res.status(400).json({ success: false, msg: "Invalid email" });
    // }
    let { mail, displayName, givenName, surname } = data;
    mail = mail.toLowerCase();

    const checkUser = await User.findOne({ email: mail }); //check if there is a staff with the email in the db
    if (checkUser) {
      // if (!checkUser.photo || checkUser.photo.image != avatar) {
      //   const staffPhoto = new Photo({ image: avatar });
      //   await staffPhoto.save();

      //   checkUser.photo = staffPhoto.id;
      //   await checkUser.save();
      // }
      if (!checkUser.fullname) {
        checkUser.fullname = displayName;
        await checkUser.save();
      }

      const token = checkUser.getSignedJwtToken(); //generate token
      return res.status(201).cookie("token", token).json({
        success: true,
        token,
      });
    }

    // const staffPhoto = new Photo({ image: avatar });
    // await staffPhoto.save();

    // ! logic for existing user not found

    const payload = {
      email: mail,
      fullname: displayName,
      firstname: givenName,
      lastname: surname,
      // photo: staffPhoto.id,
      photo: avatar,
    };

    payload.tenant = payload.tenant || (await getTenantByEmail(payload?.email));
    await userTenantSubscriptionCheck(payload);

    const newUser = new User(payload);
    // const newUser = new User({ email: mail, fullname: displayName});
    const user = await newUser.save(); //add new user to the db

    // // send email to hr
    // await staffRegistrationEmail(newUser)

    console.log({ newUser, user });
    // await enrollUserToAllCourses(user);  // ? partial logic
    await userTenantPostCreationLogic(user);

    const token = generateToken({ staff: newUser }); //generate token
    return res.status(200).cookie("token", token).json({
      success: true,
      msg: "User successfuly added",
      token,
      tenant: newUser?.tenant,
      data: newUser,
    });
  } catch (err) {
    if (err.response.status === 401) {
      return res.status(401).json({ success: false, msg: err.response.data });
    }
    return res.status(500).json({ success: false, msg: err.message });
  }
};

// @desc    Login User
// @route   POST/api/v1/auth/login/min
// @access   Public
exports.minimalLogin = asyncHandler(async (req, res, next) => {
  req.body.email = req.body.email && req.body.email?.toLowerCase();
  const { email, tenant } = req.body;

  //validate email & tenant
  if (!email) return next(new ErrorResponse("Please Provide an email", 400));
  if (!tenant) return next(new ErrorResponse("Please Provide an tenant", 400));

  //check for user
  const user = await User.findOne({ email, tenant });
  if (!user) return next(new ErrorResponse("Invalid credentials", 401));

  if (user.invited === true) {
    sendInvitedResponse(user, 200, res);
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
    sendTokenResponse(user, 200, res);
  }
});

// @desc    Login User
// @route   POST/api/v1/auth/login/create
// @access   Public
exports.loginOrCreate = asyncHandler(async (req, res, next) => {
  req.body.email = req.body.email && req.body.email?.toLowerCase();
  const { email, firstname, lastname } = req.body;

  //validate email & tenant
  if (!email) return next(new ErrorResponse("Please Provide an email", 400));

  // const userTenant = await getTenantByEmail(email);
  let user = await User.findOne({ email });

  if (!user) {
    if (!firstname || !lastname) {
      return next(
        new ErrorResponse("Please Provide the first name and last name", 400)
      );
    }

    const userTenant = await getTenantByEmail(email);

    req.body.role = "User";
    req.body.tenant = req.body.tenant || userTenant?._id;
    req.body.password = req.body.lastname?.toLowerCase();

    await userTenantSubscriptionCheck(req.body);

    user = await User.create(req.body);
    // await enrollUserToAllCourses(user);  // ? partial logic
    await userTenantPostCreationLogic(user);
  }

  await audit.login(user);
  sendTokenResponse(user, 200, res);
});

// TODO: update this for azure
// @desc    Update User Photo
// @route   PATCH /api/v1/user/:id/photo
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
