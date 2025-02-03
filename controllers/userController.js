const multer = require("multer");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const handlerFactory = require("./handlerFactory");

const multerStorage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'public/img/users')
  },
  filename:(req,file,cb)=>{
    const ext = file.mimetype.split('/')[1];
    cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')) cb(null,true);
  else cb(new AppError("Only images are allowed",400),false);
}

const upload = multer({
  storage:multerStorage,
  fileFilter:multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

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

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = async (req, res, next) => {
  //? 1) create error if use POSTs password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError("This route is not for password updates. Pleasse use /updateMyPassword ", 400)
    );

  //? 2) Filter out unwanted fields from req.body
  const filteredBody = filterObj(req.body, "name", "email");
  if(req.file) filteredBody.photo = req.file.filename;

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

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.updateUser = handlerFactory.updateOne(User); // only for administrators //* Do not update PASSWORDS with this
exports.deleteUser = handlerFactory.deleteOne(User); // only for administrators
