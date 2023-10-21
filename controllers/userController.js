const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");

exports.getAllUsers = async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: users,
  });
};

exports.createUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  console.log(newUser);
  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
  });
});
