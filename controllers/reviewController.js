const Review = require("../models/reviewModel");
const handlerFactory = require("./handlerFactory");

// exports.getAllReviews = async (req, res, next) => {
//   try {
//     let filter = {};

//     if (req.params.tourId) filter = {tour: req.params.tourId};

//     const allReviews = await Review.find(filter);
//     res.status(200).json({
//       status: "success",
//       results: allReviews.length,
//       data: {
//         allReviews,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({error: "Failed to fetch reviews"});
//   }
// };

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

// exports.createReview = async (req, res, next) => {
//   try {
//     if (!req.body.tour) req.body.tour = req.params.tourId;
//     if (!req.body.user) req.body.user = req.user.id;

//     const newReview = await Review.create(req.body);
//     res.status(200).json({
//       status: "success",
//       data: {
//         newReview,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({error: "Failed to create reviews"});
//   }
// };


exports.getAllReviews = handlerFactory.getAll(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.getReview = handlerFactory.getOne(Review);
