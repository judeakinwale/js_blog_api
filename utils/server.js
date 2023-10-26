// const path = require("path");
// const express = require("express");
// const dotenv = require("dotenv");
// const morgan = require("morgan");
// const colors = require("colors");
// const fileupload = require("express-fileupload");
// const cookieParser = require("cookie-parser");
// const mongoSanitize = require("express-mongo-sanitize");
// const helmet = require("helmet");
// const xss = require("xss-clean");
// const rateLimit = require("express-rate-limit");
// const hpp = require("hpp");
// const cors = require("cors");
// const errorHandler = require("./middleware/error");
// const connectDB = require("./config/db");

// // Routes Files
// const auth = require("./routes/Auth");
// const user = require("./routes/User");
// const instructor = require("./routes/Instructor");
// const userCourse = require("./routes/UserCourse");
// const book = require("./routes/Book");
// const course = require("./routes/Course");
// const category = require("./routes/Category");
// const tag = require("./routes/Tag");
// const discussion = require("./routes/Discussion");
// const review = require("./routes/Review");
// const courseDocument = require("./routes/CourseDocument");
// const quiz = require("./routes/Quiz");
// const courseSection = require("./routes/CourseSection");
// const courseVideo = require("./routes/CourseVideo");
// const webinar = require("./routes/Webinar");
// const license = require("./routes/License");
// const organization = require("./routes/Organization");
// const order = require("./routes/Order");
// const feature = require("./routes/Feature");
// const question = require("./routes/Question");
// const announcement = require("./routes/Announcement");

// //load env vars
// dotenv.config({ path: "./config/.env" });

// //connect to database
// connectDB();

// const app = express();

// //Boy Parser
// app.use(express.json());

// // Dev logging middleware
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }
// //file uploads
// app.use(fileupload());

// //Sanitize data
// app.use(mongoSanitize());

// //set security headers
// app.use(helmet());

// // Prevent XSS attacks
// app.use(xss());

// //Rate limiting
// const limiter = rateLimit({
//   windowMs: 20 * 60 * 1000, // 20 mins
//   max: 300,
// });
// app.use(limiter);

// //prevent http param pollution
// app.use(hpp());

// //enable CORS
// app.use(cors());

// //Mount Routers

// app.use("/api/v1/auth", auth);
// app.use("/api/v1/user/", user);
// app.use("/api/v1/instructor/", instructor);
// app.use("/api/v1/user-course", userCourse);
// app.use("/api/v1/book/", book);
// app.use("/api/v1/course/", course);
// app.use("/api/v1/category/", category);
// app.use("/api/v1/tag/", tag);
// app.use("/api/v1/review/", review);
// app.use("/api/v1/discussion/", discussion);
// app.use("/api/v1/course-discussion/", discussion);
// app.use("/api/v1/course-document/", courseDocument);
// app.use("/api/v1/quiz/", quiz);
// app.use("/api/v1/course-quiz/", quiz);
// app.use("/api/v1/course-section/", courseSection);
// app.use("/api/v1/course-video/", courseVideo);
// app.use("/api/v1/webinar/", webinar);
// app.use("/api/v1/license/", license);
// app.use("/api/v1/organization/", organization);
// app.use("/api/v1/order/", order);
// app.use("/api/v1/feature/", feature);
// app.use("/api/v1/question/", question);
// app.use("/api/v1/announcement/", announcement);

// app.use(errorHandler);

// //Set static folder
// app.use(express.static(path.join(__dirname, "public")));

// app.get("/*", function (req, res) {
//   res.sendFile(path.join(__dirname, "public/index.html"), function (err) {
//     if (err) {
//       res.status(500).send(err);
//     }
//   });
// });

// const PORT = process.env.PORT || 8000;
// const server = app.listen(
//   PORT,
//   console.log(
//     `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
//   )
// );

// //Handle unhandled promise rejections
// process.on("unhandledRejection", (err, promise) => {
//   console.log(`Error: ${err.message}`.red);
//   // close Server & exit Process

//   server.close(() => process.exit(1));
// });
