const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./../../models/tourModel");
const Review = require("./../../models/reviewModel");

dotenv.config({path: "./config.env"});

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connection successfully established");
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
  });

// Read JSON File
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));

//? Import Data Into DB
const importData = async () => {
  try {
    await Review.create(reviews);
    console.log("data successfully loaded !");
  } catch (err) {
    console.error("Error in importing data", err);
  }
  process.exit();
};

//? Delete Data from DB

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log("data successfully deleted !");
  } catch (err) {
    console.error("Error in importing data", err);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
