const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const handlerFactory = require("./handlerFactory");

exports.getCheckoutSession = async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError("No Tour Found With This Id", 404));
  }

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // information about the session
    payment_method_types: ["card"],
    mode: "payment", 
    success_url: `${req.protocol}://${req.get("host")}/`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100, // Stripe expects price in cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  //3) Create session as response
  res.status(200).json({
    status: "success",
    session,
  });
};
