const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json()); //* express.json => middleware

const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));

const getAllTours = (req, res) => {
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
};

const getTour = (req, res) => {
  const id = Number(req.params.id);

  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "No tour found with that ID",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      tour,
    },
  });
};

const CreateTour = (req, res) => {
  const newId = tours.length;
  const newTour = Object.assign({id: newId}, req.body);

  tours.push(newTour);

  fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
    res.status(201).json({
      // 201 => created a new tour successfully
      status: "success",
      data: {
        tour: newTour,
      },
    });
  });
};

const updateTour = (req, res) => {
  const id = Number(req.params.id);
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: "fail",
      message: "No tour found with that ID",
    });
  }

  // Update the tour with the new data
  Object.assign(tour, req.body);

  fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
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

const deleteTour = (req, res) => {
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
  fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
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

// app.get("/api/v1/tours", getAllTours);
// app.post("/api/v1/tours", CreateTour);
// app.get("/api/v1/tours/:id", getTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

app
  .route("/api/v1/tours")
  .get(getAllTours)
  .post(CreateTour);

app
  .route("/api/v1/tours/:id")
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);


const port = 3000;
app.listen(port, () => {
  console.log("app running on port : 3000");
});
