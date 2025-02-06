const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

const app = express();

// 1) Global Middlewares

// Set Security HTTP Headers
app.use(helmet()); // set HTTP response headers (it's best to use this helmet package early in the middleware stack  )

// Development logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Limit request from same IP
const limiter = rateLimit({
  max: 200, // 200 request with the same ip address
  windowMs: 60 * 60 * 1000, // in one hour
  message: "Too many requests from this IP, please try again in an hour.",
});
app.use("/api", limiter);

// body parser, reading data from body into req.body
app.use(express.json({limit: "10kb"}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss()); // clean any user input from maliciou HTML code

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGrroupSize",
      "difficulty",
      "price",
    ],
  })
);

// Serving static files from the public directory
app.use(express.static(`${__dirname}/public`));

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  next();
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

//? Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
