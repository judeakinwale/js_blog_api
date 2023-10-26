const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
// const Permission = require("../models/Permission");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (!req.headers.authorization) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
    // Set token from cookie
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// exports.hasPermission = (requiredPermission) => {
//   return async (req, res, next) => {
//     const userPermissions = req.user.role.permissions || [];
//     if (!userPermissions.includes(requiredPermission)) {
//       return new ErrorResponseJSON(
//         res,
//         `User role ${req.user.role.roleType} does not have the permission to access this route`,
//         403
//       );
//     }
//     next();
//   };
// };
