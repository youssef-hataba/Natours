const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //* Execute Query
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error getting tours",
      error: err.message,
    });
  }
};

exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id); //? === Tour.findOne({_id:req.params.id});

    if (!tour) {
      return next(new AppError("No Tour Found With This Id", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: "Tour not found",
      error: err.message,
    });
  }
};

exports.CreateTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating tour",
      error: err.message,
    });
  }
};

exports.updateTour = async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!tour) {
      return next(new AppError("No Tour Found With This Id", 404));
    }

    res.status(201).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error updating tour",
      error: err.message,
    });
  }
};

exports.deleteTour = async (req, res,next) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      return next(new AppError("No Tour Found With This Id", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error deleting tour",
      error: err.message,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    //?  Aggregation Pipeline :
    const stats = await Tour.aggregate([
      {
        $match: {ratingsAverage: {$gte: 4.5}},
      },
      {
        $group: {
          _id: "$difficulty",
          numTours: {$sum: 1},
          numRatings: {$sum: "$ratingsQuantity"},
          avgRating: {$avg: "$ratingsAverage"},
          avgPrice: {$avg: "$price"},
          minPrice: {$min: "$price"},
          maxPrice: {$max: "$price"},
        },
      },
      {
        $sort: {avgPrice: 1},
      },
      {
        $match: {_id: {$ne: "easy"}},
      },
    ]);

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error getting tour stats",
      error: err.message,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = Number(req.params.year);

    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates", //* unwind : is gonna do deconstruct an array field from the info documents and then output one document for each element of the array
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {$month: "$startDates"},
          numTourStarts: {$sum: 1},
          tours: {$push: "$name"},
        },
      },
      {
        $addFields: {month: "$_id"},
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {numTourStarts: -1},
      },
      // {
      //   $limit: 6
      // },
    ]);

    res.status(200).json({
      status: "success",
      data: plan,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error getting monthly plan",
      error: err.message,
    });
  }
};
