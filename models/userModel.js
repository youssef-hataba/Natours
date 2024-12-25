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
})

const User = mongoose.model("User", userSchema);

module.exports = User;
