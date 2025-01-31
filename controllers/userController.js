const User = require("../models/userModel");
const AppError = require("../utils/appError");
const handlerFactory = require("./handlerFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find();

//     res.status(200).json({
//       status: "success",
//       results: users.length,
//       data: {
//         users,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       message: "Error getting users",
//       error: err.message,
//     });
//   }
// };

exports.updateMe = async (req, res, next) => {
  //? 1) create error if use POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError("This route is not for password updates. Pleasse use /updateMyPassword ", 400)
    );

  //? 2) Filter out unwanted fields from req.body
  const filteredBody = filterObj(req.body, "name", "email");

  //? 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
};

exports.deleteMe = async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {active: false});
  res.status(204).json({
    status: "success",
    data: null,
  });
};

exports.getAllUsers = handlerFactory.getAll(User)
exports.getUser = handlerFactory.createOne(User);
exports.updateUser = handlerFactory.updateOne(User); // only for administrators //* Do not update PASSWORDS with this
exports.deleteUser = handlerFactory.deleteOne(User); // only for administrators
