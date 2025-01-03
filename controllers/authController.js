const {promisify} = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error Signing Up!",
      error: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({email}).select("+password");

    if (!user || !(await user.comparePassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401)); //* 401 => unauthorized
    }

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      token,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error Login In!",
      error: err.message,
    });
  }
};

exports.protect = async (req, res, next) => {
  let currentUser;
  try {
    //? 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Please log in to get access to the tours", 401));
    }

    //? 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //* id , issued data , expire data

    //? 3) Check if user still exists
    currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new AppError("The user belonging to this token does no longer exist.", 401));
    }

    //? 4) check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError("User recently changed password! Please login again.", 401));
    }
  } catch (err) {
    return next(new AppError("Invalid token, please login again", 401));
  }

  //* Grant Access to Protected Route
  req.user = currentUser;
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  try {
    //? 1) Get user based on Posted Email
    const user = await User.findOne({email: req.body.email});

    if (!user) {
      return next(new AppError("No user found with this email", 404));
    }

    //? 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    //? 3) Sen it to user's email
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    const message = `You are receiving this email because you has requested a password reset
    for your account.\n\nPlease click on the following link to reset your password:\n\n${resetURL}\n\n
    If you did not request this, please ignore this email and your password will remain unchanged.\n`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "Reset password email sent!",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({validateBeforeSave: false});
      return next(new AppError("There was an error sending email. Please try again later", 500));
    }
  } catch (err) {
    return next(new AppError("Error sending email. Please try again later", 500));
  }
};

exports.resetPassword = (req, res, next) => {};
