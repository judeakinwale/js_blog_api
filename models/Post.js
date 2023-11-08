const mongoose = require("mongoose");

const Post = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["featured", "headline", "alert", "post"],
    default: "post",
  },
  content: {
    type: String,
    required: true,
  },
  // author: {  // storing author as a user id
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  author: {
    type: String,
    required: true,
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  images: [String], // Store image URLs as strings
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    // default: new Date(),
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

Post.index({ title: "text", description: "text" });

// storing author as a user id
// Post.path("author").validate(async (value) => {
//   // return await mongoose.model("User").findById(value);
//   return await mongoose.model("User").exists({_id: value});
// }, "Author does not exist");

module.exports = mongoose.model("Post", Post);
