const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");
// const passport = require("passport");  // import passport

//load env vars
dotenv.config({ path: "./config/.env" });

// Routes Files
const audit = require("./routes/AuditTrail");
const auth = require("./routes/Auth");
const user = require("./routes/User");
const post = require("./routes/Post");
const comment = require("./routes/Comment");

//connect to database
connectDB();

const app = express();

//Boy Parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
//file uploads
app.use(fileupload());

//Sanitize data
app.use(mongoSanitize());

//set security headers
app.use(helmet());
// app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));  // ! for scp headers error in frontend build

// Prevent XSS attacks
app.use(xss());

//Rate limiting
const limiter = rateLimit({
  windowMs: 20 * 60 * 10000, // 20 mins
  max: 3000,
});
app.use(limiter);

//prevent http param pollution
app.use(hpp());

//enable CORS
app.use(cors());

// use passport
// app.use(passport.initialize());
// app.use(passport.session());

//Mount Routers
app.use("/api/v1/audit/", audit);
app.use("/api/v1/auth/", auth);
app.use("/api/v1/user/", user);
app.use("/api/v1/post/", post);
app.use("/api/v1/comment/", comment);

// Use Custom Error Handler
app.use(errorHandler);

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

// app.use("*", function (req, res) {
//   res.status(404).json({ message: "route does not exist" });
// });
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
  )
);

//Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // close Server & exit Process
  server.close(() => process.exit(1));
});
