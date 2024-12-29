const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a name"],
    trim: true,
    minlength: [3, "Name must be at least 3 characters long"],
    maxlength: [50, "Name must not exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "User must have an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email address"],
  },
  photo: String,
  password: {
    type: String,
    required: [true, "User must have a password"],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //? this is only work in create and save
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords do not match",
    },
  },
});

userSchema.pre('save', async function(next){
  //? only run this function if password was actually modified
  if(!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 14);//? hash the password with const of 14
  this.passwordConfirm = undefined;//? delete passwordConfirm
  next();
});


//? instance method (method that gonna be avilable on all documents of a certain collection)
userSchema.methods.comparePassword = async function (candidatePassword , userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);//? we cannot compare them manually because 
  //? the candidate password in not hashed (the password coming from the user ) but user Password hashed 
};

const User = mongoose.model("User", userSchema);

module.exports = User;
