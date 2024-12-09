const fs = require("fs");
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

exports.checkID = (req, res, next, val) => {
  console.log(`tour id is : ${val}`);

  const tour = tours.find((el) => el.id === Number(val));

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "No tour found with that ID",
    });
  }

  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price)
    return res.status(404).json({status: "fail", message: "Missing name or price"});
  next();
};

exports.getAllTours = (req, res) => {
  console.log(req.requestTime);

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
};

exports.getTour = (req, res) => {
  const id = Number(req.params.id);
  const tour = tours.find((el) => el.id === id);

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
};

exports.CreateTour = (req, res) => {
  const newId = tours.length;
  const newTour = Object.assign({id: newId}, req.body);

  tours.push(newTour);

  fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
    res.status(201).json({
      // 201 => created a new tour successfully
      status: "success",
      data: {
        tour: newTour,
      },
    });
  });
};

exports.updateTour = (req, res) => {
  const id = Number(req.params.id);
  const tour = tours.find((el) => el.id === id);

  Object.assign(tour, req.body);

  fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Failed to update the tour",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  });
};

exports.deleteTour = (req, res) => {
  const id = Number(req.params.id);
  const tourIndex = tours.findIndex((el) => el.id === id);

  if (tourIndex === -1) {
    return res.status(404).json({
      status: "fail",
      message: "No tour found with that ID",
    });
  }

  // Remove the tour from the array
  tours.splice(tourIndex, 1);

  // Update the JSON file
  fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Failed to delete the tour",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};
