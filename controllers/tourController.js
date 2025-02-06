const multer = require("multer");
const sharp = require("sharp");
const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const handlerFactory = require("./handlerFactory");

const multerStorage = multer.memoryStorage({});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Only images are allowed", 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// upload.single('image') -> req.file;
// upload.array('images',5) -> req.files;

exports.uploadTourImages = upload.fields([
  {name: "imageCover", maxCount: 1},
  {name: "images", maxCount: 3},
]);

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // 1) Cover Image
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(req.files.images.map(async (file, index) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({quality: 90})
      .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
  }));

  next();
};

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

// exports.getAllTours = async (req, res) => {
//   try {
//     // Execute Query
//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//     const tours = await features.query;

//     res.status(200).json({
//       status: "success",
//       results: tours.length,
//       data: {
//         tours,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       message: "Error getting tours",
//       error: err.message,
//     });
//   }
// };

// exports.getTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findById(req.params.id)
//     .populate({
//       path: "reviews",
//       select: "-__v ",
//     }); //* populate -> fill the guides up with the actual data in the query and not the in DB

//     if (!tour) {
//       return next(new AppError("No Tour Found With This Id", 404));
//     }

//     res.status(200).json({
//       status: "success",
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: "fail",
//       message: "Tour not found",
//       error: err.message,
//     });
//   }
// };

// exports.CreateTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: "success",
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       message: "Error creating tour",
//       error: err.message,
//     });
//   }
// };

// exports.updateTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!tour) {
//       return next(new AppError("No Tour Found With This Id", 404));
//     }

//     res.status(201).json({
//       status: "success",
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       message: "Error updating tour",
//       error: err.message,
//     });
//   }
// };

// exports.deleteTour = async (req, res, next) => {
//   try {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//       return next(new AppError("No Tour Found With This Id", 404));
//     }

//     res.status(204).json({
//       status: "success",
//       data: null,
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       message: "Error deleting tour",
//       error: err.message,
//     });
//   }
// };

exports.getAllTours = handlerFactory.getAll(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);
exports.createTour = handlerFactory.createOne(Tour);
exports.getTour = handlerFactory.getOne(Tour, {path: "reviews"});

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
