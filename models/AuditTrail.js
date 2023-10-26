const mongoose = require("mongoose");

// Define the AuditTrail schema
const AuditTrail = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the user who made the change
    // required: true,
  },
  email: {
    type: String,
    // required: true,
  },
  resourceName: {
    type: String,
    // required: true,
  },
  operation: {
    type: String,
    enum: ["create", "update", "delete", "login", "logout"],
    required: true,
  },
  description: {
    type: String,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // Store the changes as a flexible data type
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AuditTrail", AuditTrail);
