const Review = require("../models/reviewModel");
const AppError = require("../utils/appError");

exports.getAllReviews = async (req, res, next) => {
  try {
    const allReviews = await Review.find();
    res.status(200).json({
      status: "success",
      results:allReviews.length,
      data: {
        allReviews,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};


exports.createReview = async(req, res, next) => {
  try {
    const newReview = await Review.create(req.body);
    res.status(200).json({
      status: "success",
      data: {
        newReview,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reviews' });
  }
};
