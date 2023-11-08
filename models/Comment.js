const mongoose = require("mongoose");
const { timestampOptions } = require("../utils/mongooseUtils");

const Comment = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      // required: true,
    },
    title: {
      type: String,
    },
    text: {
      type: String,
      required: true,
    },
    // author: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    name: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      // required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // createdAt: {
    //   type: Date,
    //   default: () => new Date.now(),
    //   // default: new Date(),
    // },
    // updatedAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },
  timestampOptions 
);

// Comment.index({ post: "text", author: "text" });
Comment.index({ post: "text", name: "text", email: "text" });

module.exports = mongoose.model("Comment", Comment);
