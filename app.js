const express = require("express");
const fs = require("fs");
const morgan = require("morgan");

const app = express();

//? 1) Middlewares

app.use(morgan("dev"));

app.use(express.json()); //* express.json => middleware

app.use((req, res, next) => {
  console.log("hello from the middleware");
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`));

const getAllTours = (req, res) => {
  console.log(req.requestTime);

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
};

//? 2) Route Handlers
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

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  })
}
const CreateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  })
}
const getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  })
}
const updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  })
}
const deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  })
}

//? 3) Routes
app.route("/api/v1/tours").get(getAllTours).post(CreateTour);

app.route("/api/v1/tours/:id").get(getTour).patch(updateTour).delete(deleteTour);

app.route("/api/v1/users").get(getAllUsers).post(CreateUser);

app.route("/api/v1/users/:id").get(getUser).patch(updateUser).delete(deleteUser);

//? 4) Start the Server
const port = 3000;
app.listen(port, () => {
  console.log("app running on port : 3000");
});
