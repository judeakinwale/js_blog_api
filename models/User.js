const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  //pelumi
  // companyId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Company",
  // },
  isSubscribed: {
    type: Boolean,
    default: false,
  },
  //pelumi

  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
  },
  fullname: {
    type: String,
  },
  firstname: {
    type: String,
    required: [true, "Please add Firstname"],
  },
  middlename: {
    type: String,
  },
  lastname: {
    type: String,
    required: [true, "Please add Lastname"],
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
  },
  dob: { type: String },
  phone: {
    type: String,
    // unique: true,
  },
  department: {
    type: String,
  },
  gender: {
    type: String,
  },
  address: {
    type: String,
  },
  role: {
    type: String,
    enum: ["User", "Admin", "SuperAdmin", "Instructor"],
    default: "User",
  },

  password: {
    type: String,
    required: [true, "Please add a password"],
    // minlength: 6,
    select: false,
  },

  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },
  points: {
    type: Number,
    default: 0,
  },
  isTrial: {
    type: Boolean,
    default: true,
  },
  trialExpiry: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  activationToken: String,
  activationExpire: Date,

  resetPasswordToken: String,
  resetPasswordExpire: Date,
  photo: {
    type: String,
  },
  state: {
    type: String,
  },
  lga: {
    type: String,
  },

  loginAttempts: [{ type: String }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
//Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  this.fullname = `${this.firstname} ${this.lastname}`;
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//match user entered password to hashed password in db
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
//Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      firstname: this.firstname,
      lastname: this.lastname,
      email: this.email,
      phone: this.phone,
      tenant: this.tenant,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};
//Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  //Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");
  //Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

//Generate and hash password token
UserSchema.methods.getActivationToken = function () {
  //Generate token
  const activationToken = crypto.randomBytes(20).toString("hex");
  //Hash token and set to activationToken field
  this.activationToken = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");

  //set expire
  this.activationExpire = Date.now() + 300 * 60 * 1000;
  return activationToken;
};

UserSchema.index({
  tenant: "text",
  email: "text",
  isTrial: "text",
  isTitle: "text",
});

UserSchema.path("subscription").validate(async (value) => {
  return await mongoose.model("Subscription").findById(value);
}, "Subscription does not exist");

module.exports = mongoose.model("User", UserSchema);
