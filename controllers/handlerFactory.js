const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No Document Found With This Id`, 404));
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

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No Document Found With This Id", 404));
    }

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
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

exports.createOne = (Model) => async (req, res) => {
  try {
    const newdoc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: newdoc,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error creating model",
      error: err.message,
    });
  }
};

exports.getOne= (Model,popOptions) =>  async (req, res, next) => {
  try {
    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate(popOptions);

    const doc = await query

    if (!doc) {
      return next(new AppError("No Document Found With This Id", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data:doc,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: "document not found",
      error: err.message,
    });
  }
};

exports.getAll = (Model)=>async (req, res) => {
  try {

    // To Allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = {tour: req.params.tourId};
    
    //* Execute Query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        data:doc,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error getting document",
      error: err.message,
    });
  }
};
