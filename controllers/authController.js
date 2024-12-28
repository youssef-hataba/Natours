const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError")

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const token = jwt.sign({id: newUser._id},process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

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
  try{
    const {email,password} =req.body;
    if(!email ||!password){
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({email:email, password:password});

    const token = "";
    res.status(200).json({
      status:"success",
      token
    })
    
  }catch(err){
    res.status(500).json({
      status: "fail",
      message: "Error Login In!",
      error: err.message,
    });
  }

}
