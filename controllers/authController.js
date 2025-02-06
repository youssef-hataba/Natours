const crypto = require("crypto");
const {promisify} = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true, //Makes the cookie accessible only via HTTP(S) and not client-side JavaScript (Protects the cookie from cross-site scripting (XSS) attacks)
    // secure: true,// Ensures the cookie is sent only over HTTPS
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token,cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;

    await new Email(newUser,url).sendWelcome();

    createSendToken(newUser, 201, res);
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

    createSendToken(user, 200, res);
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
      return next(new AppError("Please login to get access", 401));
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
    
    try {
      const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
      await new Email(user,resetURL).sendPasswordReset();

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

exports.resetPassword = async (req, res, next) => {
  try {
    //? 1) Get user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {$gt: Date.now()},
    });

    //? 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError("Token is invalid or expired", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    //? 3) Update changedPasswordAt property for the user

    //? 4) Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    return next(new AppError("Invalid token or password reset expired", 400));
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    //? 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password");

    //? 2) check if posted current password is correct
    if (!(await user.comparePassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError("Invalid Password", 401));
    }

    //? 3) If correct, update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();
    // User.findByIdAndUpdate will not work as intended! all validator and midle ware like (encrypt the password ) don't work in itr

    //? 4) Log user in , send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    return next(new AppError("Error updating password", 500));
  }
};

//833VW6PETJP35BGP78KRHE51 akdlfjai19KALH*(!LLA