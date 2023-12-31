const mongoose = require("mongoose");
const { timestampOptions } = require("../utils/mongooseUtils");

const Category = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    }, // Store image URLs as strings
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
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

Category.index({ title: "text", description: "text" });

module.exports = mongoose.model("Category", Category);
