const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({path: "./config.env"});
const app = require("./app"); 

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connection successfully established");
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
  });


const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`app running on port : ${port}`);
});
