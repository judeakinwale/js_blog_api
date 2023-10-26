const ErrorResponse = require("./errorResponse");
const sendEmail = require("./sendEmail");

exports.activateAccountEmail = async (req, res, user) => {
  //Get reset token
  const activationToken = user.getActivationToken();
  await user.save({ validateBeforeSave: false });

  //Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/activate/${activationToken}`;

  const salutation = `Hello ${user.firstname ?? user.fullname}`;
  //   const content = `You are receiving this email because you (or someone else) has requested
  // the reset of a password, Please click on this button to complete your password reset \n\n <br /><br /> <a href="${resetUrl}" style="padding:1rem;color:black;background:#ff4e02;border-radius:5px;text-decoration:none;">Reset Password</a> \n\n <br /><br /> This link would expire in 10 minutes <br /><br/> Kindly ignore if you did not initate this request`;
  const content = `You are receiving this email because you recently created an account, Please click on this button to activate your account \n\n <br /><br /> <a href="${resetUrl}" style="padding:1rem;color:black;background:#ff4e02;border-radius:5px;text-decoration:none;">Activate</a> \n\n <br /><br /> This link would expire in 5 hours <br /><br/> Kindly ignore if you did not create an account`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Account Activation",
      // message: "",
      salutation,
      content,
    });
    // res.status(200).json({ success: true, data: "Email Sent" });
    return true;
  } catch (err) {
    console.log(err);
    user.activationToken = undefined;
    user.activationExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return false;
    // throw new Error("Email could not be sent");
    // return next(new ErrorResponse("Email could not be sent", 500));
  }
};

exports.courseEnrollmentEmail = async (user, course) => {
  const salutation = `Hello ${user.firstname ?? user.fullname}`;
  const content = `You have sucessfully enrolled for the course: ${course.title}. Kindly visit your dashboard for more details. Kindly ignore if you did not create an account`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Course Enrollment",
      // message: "",
      salutation,
      content,
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

exports.courseCompletionEmail = async (user, course) => {
  const salutation = `Congratulation ${user.firstname ?? user.fullname}`;
  const content = `You have sucessfully completed the course: ${course.title}. Kindly visit your dashboard for more details.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Course Completion",
      // message: "",
      salutation,
      content,
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
