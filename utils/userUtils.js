const fs = require("fs");
const UserCourse = require("../models/UserCourse");
// const UserBook = require("../models/UserBook");
// const UserWebinar = require("../models/UserWebinar");
const { getCourseDetails, getCourseResources } = require("./courseUtils");
const Course = require("../models/Course");
// const Book = require("../models/Book");
// const Webinar = require("../models/Webinar");
const Review = require("../models/Review");
// const Instructor = require("../models/Instructor");
const { courseEnrollmentEmail } = require("./emailUtils");
const ErrorResponse = require("./errorResponse");
const User = require("../models/User");
const {
  getTenantByEmail,
  updateTenantStaffSubscription,
} = require("./tenantUtils");
const Quiz = require("../models/Quiz");
const Tenant = require("../models/Tenant");
const Subscription = require("../models/Subscription");
const UserQuiz = require("../models/UserQuiz");
// const UserCourse = require("../models/UserCourse");
const { toDecimal } = require("./utils");

exports.loginWorkaround = async (payload) => {
  if (payload?.user) return payload;
  if (!payload?.email)
    throw new ErrorResponse("No user or email provided!", 400);

  payload.email = payload.email?.toLowerCase();

  const user = await User.findOne({ email: payload?.email });
  if (!user) throw new ErrorResponse("Invalid email provided!", 400);

  payload.user = user;
  return payload;
};

exports.updateUserCoursePayload = async (payload) => {
  if (!payload?.user) throw new ErrorResponse("Invalid user id provided!", 400);

  const user = await User.findById(payload?.user);
  if (!user) throw new ErrorResponse("Invalid user id provided!", 400);

  payload.tenant = user?.tenant || (await getTenantByEmail(user?.email));
  return payload;
};

exports.getUserCourseResources = async (userCourse) => {
  const relatedUserQuizzes = (
    await UserQuiz.find({
      user: userCourse?.user,
    }).populate([{ path: "quiz" }])
  ).filter((r) => String(r.quiz?.course) == String(userCourse?.course?._id));

  // check for valid user quizzes
  const userQuizzes = relatedUserQuizzes;

  // account for completed user quizzes and user quiz percentage completion
  let quizCompletion = 0;
  for (const userQuiz of userQuizzes) {
    if (userQuiz.isCompleted) {
      quizCompletion += 1;
      continue;
    }
    quizCompletion += userQuiz.percentageCompletion / 100;
  }
  const userVideos = userCourse?.videoCompletion || [];
  const resourceCount = userQuizzes?.length + userVideos?.length;
  const resourceCompletion = quizCompletion + userVideos?.length;

  return {
    userVideos,
    userQuizzes,
    resourceCount,
    resourceCompletion,
    userVideosCount: userVideos?.length,
    userQuizzesCount: userQuizzes?.length,
  };
};

exports.calculatePercentageCompletion = async (userCourseId) => {
  const userCourse = await UserCourse.findById(userCourseId).populate("course");
  if (!userCourse)
    return next(
      new ErrorResponse(`UserCourse (Course Enrollment) not found!`, 404)
    );

  const course = userCourse.course;

  const { resourceCount } = await getCourseResources(course);
  const { resourceCompletion } = await this.getUserCourseResources(userCourse);
  const rawPercentage = (resourceCompletion / resourceCount) * 100;
  if (rawPercentage > 100)
    console.error(
      "Error: the raw course completion percentage is greater than 100"
    );
  const percentage = rawPercentage > 100 ? 100 : toDecimal(rawPercentage);
  // console.log({
  //   resourceCount,
  //   resourceCompletion,
  //   percentage,
  // });

  return percentage;
};

exports.updateUserCourseDetails = async (userCourse) => {
  if (!userCourse)
    throw new ErrorResponse("Invalid user course provided!", 400);

  const relatedUserQuiz = (
    await UserQuiz.find({
      user: userCourse?.user,
    }).populate([{ path: "quiz" }])
  ).filter((r) => String(r.quiz?.course) == String(userCourse?.course?._id));

  let quizPoints = 0;
  let quizScore = 0;
  let quizPercentageScore = 0;
  relatedUserQuiz.forEach((uq) => {
    quizPoints += Number(uq?.points || 0);
    quizScore += Number(uq?.score || 0);
    quizPercentageScore += Number(uq?.percentageScore || 0);
  });

  let videoPoints = 0;
  userCourse?.videoCompletion?.map((vc) => {
    videoPoints += Number(vc?.points || 0);
  });

  const payload = {};
  payload.score = quizScore;
  payload.points = quizPoints + videoPoints;

  payload.percentageScore = quizPercentageScore / relatedUserQuiz.length; // average percentage score
  if (isNaN(payload.percentageScore)) payload.percentageScore = Number(0);

  payload.isPassed = payload.percentageScore >= 60;
  payload.percentageCompletion = await this.calculatePercentageCompletion(
    userCourse?._id
  );
  payload.isCompleted = payload.percentageCompletion >= 99;

  if (payload.percentageCompletion && userCourse.status == "Pending")
    payload.status = "Started";
  if (payload.isCompleted) payload.status = "Completed";

  // console.log({
  //   userCourse,
  //   relatedUserQuiz: relatedUserQuiz?.length,
  //   quizPoints,
  //   quizScore,
  //   videoPoints,
  //   relatedUserQuiz: relatedUserQuiz.length,
  //   payload,
  // });

  // ?  fix property decimal representation
  payload.score = toDecimal(payload.score);
  payload.points = toDecimal(payload.points);
  payload.percentageScore = toDecimal(payload.percentageScore);
  payload.percentageCompletion = toDecimal(payload.percentageCompletion);

  userCourse.score = payload.score;
  userCourse.points = payload.points;
  userCourse.percentageScore = payload.percentageScore;
  userCourse.isPassed = payload.isPassed;
  userCourse.percentageCompletion = payload.percentageCompletion;
  userCourse.status = payload.status;
  userCourse.isCompleted = payload.isCompleted;
  const response = await userCourse.save();

  // update related user's points
  await this.calculateUserPoints(undefined, undefined, userCourse.user);

  return response;
};

exports.calculateUserPoints = async (
  user = undefined,
  enrolledCourses = undefined,
  userId = undefined
) => {
  console.log("calculating points");

  user = user || (await User.findById(userId));
  if (!user) throw new ErrorResponse("Invalid User or userId provided!", 400);

  const relatedUserCourses =
    enrolledCourses || (await UserCourse.find({ user }));

  let userPoints = 0;
  for (const userCourse of relatedUserCourses) {
    userPoints += Number(userCourse.points || 0);
  }
  userPoints = toDecimal(userPoints);

  if (user.points == userPoints) return userPoints;

  user.points = userPoints;
  await user.save();

  return userPoints;
};

exports.getUserDetails = async (user, isInstructor = false) => {
  if (!user) return;

  const filter = { user: user._id };
  const myReviews = await Review.find(filter).populate("user");
  const enrolledCourses = await UserCourse.find(filter).populate("course");
  const enrolledQuizzes = await UserQuiz.find(filter).populate("questions");

  // update user with current points if not points
  if (!user.points) await this.calculateUserPoints(user, enrolledCourses);

  // ? the data (UserCourse, UserQuiz) is similarly structured
  const completedCourses = enrolledCourses.filter((ec) => ec?.isCompleted);
  const completedQuizzes = enrolledQuizzes.filter((eq) => eq?.isCompleted);

  const startedFn = (d) => d?.status == "Started";
  const startedCourses = enrolledCourses.filter(startedFn);
  const startedQuizzes = enrolledQuizzes.filter(startedFn);

  const pendingFn = (d) => d?.status == "Pending";
  const pendingCourses = enrolledCourses.filter(pendingFn);
  const pendingQuizzes = enrolledQuizzes.filter(pendingFn);

  // ? the data has the percentageScore property and passing is >= 60%
  const passedFn = (d) => d?.percentageScore >= 60 || d?.isPassed;
  const passedCourses = completedCourses.filter(passedFn);
  const passedQuizzes = completedQuizzes.filter(passedFn);

  const failedFn = (d) => d?.percentageScore < 60 || !d?.isPassed;
  const failedCourses = completedCourses.filter(failedFn);
  const failedQuizzes = completedQuizzes.filter(failedFn);

  // const detailedEnrolledCourses = await Promise.all(
  //   enrolledCourses.map(async (ec) => ({
  //     ...ec.toObject(),
  //     course: await getCourseDetails(ec?.course),
  //   }))
  // );

  const lastQuiz = completedQuizzes[completedQuizzes.length - 1];
  const lastQuizPercentageScore = toDecimal(lastQuiz?.percentageScore);

  const result = {
    ...user.toObject(),
    myReviews,
    // enrolledCourses: detailedEnrolledCourses,
    enrolledCourses,
    enrolledQuizzes,
    completedCourses,
    completedQuizzes,
    startedCourses,
    startedQuizzes,
    pendingCourses,
    pendingQuizzes,
    passedCourses,
    passedQuizzes,
    failedCourses,
    failedQuizzes,
    lastQuizPercentageScore,
  };
  return result;
};

exports.userTenantSubscriptionCheck = async (payload) => {
  console.log("subscription check started");
  if (!payload?.tenant)
    throw new ErrorResponse("Related Tenant not found!", 400);

  const now = new Date();
  const tenant = await Tenant.findById(payload?.tenant).populate([
    { path: "subscriptionType" },
    { path: "subscription" },
  ]);
  if (tenant.subscriptionExpiry < now)
    throw new ErrorResponse("Tenant Subscription expired!", 400);

  const tenantStaff = await User.find({ tenant });

  const staffLimit = tenant?.subscriptionType?.userCount || 1;
  if (tenantStaff.length >= staffLimit)
    throw new ErrorResponse(
      "Maximum Number of staff for Tenant Subscription reached!",
      400
    );

  payload.subscription = tenant?.subscription?._id;
  payload.isSubscribed = true;
  payload.isTrial = false;

  return payload;
};

exports.updateRelatedUserCourseFromUserQuiz = async (userQuiz) => {
  if (!userQuiz?.quiz) throw new ErrorResponse("UserQuiz not provided!", 400);

  const quiz = await Quiz.findById(userQuiz?.quiz);
  if (!quiz) throw new ErrorResponse("Related Quiz not found!", 400);

  const filter = { user: userQuiz?.user, course: quiz?.course };

  const userCourse = await UserCourse.findOne(filter);
  if (!userCourse)
    throw new ErrorResponse("Related UserCourse not found!", 400);

  await this.updateUserCourseDetails(userCourse);
};

exports.userTenantPostCreationLogic = async (user) => {
  console.log("tenant user post creation logic");
  const tenant = await Tenant.findById(user?.tenant);
  const employees = await User.find({ tenant });

  tenant.staff = employees.map((e) => e?._id);
  tenant.admin = employees.filter((e) => e?.role == "Admin" && e?._id);
  await tenant.save();

  user.subscription = tenant?.subscription;
  await user.save();

  const courses = await Course.find();
  await this.enrollUserToAllCourses(user, courses);

  return user;
};

exports.userEnrollmentFactory = async (user, source, type = "Course") => {
  console.log("starting enrollment factory...");
  const updateOptions = {
    new: true,
    runValidators: true,
    upsert: true,
  };
  switch (type) {
    case "Course":
      const createdCourse = await UserCourse.findOneAndUpdate(
        { user, course: source },
        {},
        updateOptions
      );
      // send course enrollment email
      courseEnrollmentEmail(createdCourse?.user, createdCourse?.course);
      break;
  }
};

exports.courseEnrollmentFactory = async (user, course) => {
  console.log("starting course enrollment factory...");
  const updateOptions = {
    new: true,
    runValidators: true,
    upsert: true,
  };
  const createdCourse = await UserCourse.findOneAndUpdate(
    { user, course },
    {},
    updateOptions
  ).populate("user course");
  // // send course enrollment email
  // * courseEnrollmentEmail(createdCourse?.user, createdCourse?.course);

  return createdCourse;
};

exports.userEnrollmentCheck = async (user, source, type = "Course") => {
  switch (type) {
    case "Course":
      const existingCourse = await UserCourse.findOne({
        user,
        course: source,
      }).populate("course");
      if (existingCourse)
        throw new Error(
          `You are already enrolled for this course: ${existingCourse?.course?.title}`
        );
      break;
  }
};

exports.enrollCourseToAllUsers = async (course, users = undefined) => {
  console.log("enrolling course to all users");
  users = users || (await User.find());
  const response = await Promise.all(
    users.map(
      async (user) => await this.courseEnrollmentFactory(user?._id, course?._id)
    )
  );
  return response;
};

exports.enrollUserToAllCourses = async (user, courses = undefined) => {
  console.log("enrolling user to all courses");
  courses = courses || (await Course.find());
  const response = await Promise.all(
    courses.map(
      async (c) => await this.courseEnrollmentFactory(user?._id, c?._id)
    )
  );
  return response;
};

exports.enrollAllUsersToAllCourses = async () => {
  console.log("enrolling all users to all courses");
  const users = await User.find();
  const courses = await Course.find();
  const response = await Promise.all(
    users.map(async (user) => await this.enrollUserToAllCourses(user, courses))
  );
  fs.writeFileSync("./data.json", JSON.stringify(response, null, 2), "utf-8");
  return response;
};
