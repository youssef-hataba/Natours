const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review must contain a content"],
      minlength: [10, "Review must be at least 10 characters long"],
      maxlength: [500, "Review must not exceed 500 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Review must have a rating"],
      min: 1,
      max: 5,
      validate: {
        validator: function (v) {
          return Number.isInteger(v);
        },
        message: "Rating must be an integer value between 1 and 5",
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
  },
  {
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "tour",
    select: "name",
  }).populate({
    path: "user",
    select: "name",
  });

  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
