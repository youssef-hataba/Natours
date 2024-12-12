const express = require("express");
const tourController = require("../controllers/tourController");

const router = express.Router(); //* create a new router (router instance)

// router.param("id", tourController.checkID);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(tourController.CreateTour);

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
