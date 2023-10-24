const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const sendMail = require("../utils/mail");

const signToken = async (id) => {
  return await promisify(jwt.sign)({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const verifyToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const token = await signToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(
      new AppError("Please provide email and password to log in"),
      400
    );

  const user = await User.findOne({ email: req.body.email }).select(
    "+password"
  );
  if (!user || !(await user.passwordCorrect(password, user.password)))
    return next(
      new AppError("Wrong email or password. Please try again.", 401)
    );

  const token = await signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  const token =
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer") &&
    req.headers.authorization.split(" ")[1];
  console.log(token);
  if (!token)
    return next(new AppError("Token is missing. Please log back in", 401));

  const decoded = await verifyToken(token);
  console.log(decoded);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "The user connected to this token does no longer exist. Please log back in",
        401
      )
    );

  if (currentUser.passwordChanged(decoded.exp))
    return next(
      new AppError(
        "The user has changed his/her password after the token was issued. Please log back in",
        401
      )
    );

  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(
      new AppError(
        "Could not find a user with this email. Please try again",
        404
      )
    );

  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${token}`;

  try {
    await sendMail({
      email: user.email,
      subject: "Your password reset token. Expires in 10 minutes.",
      message: `Forgot your password? Send a PATCH request with your new password and password confirmation to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email.`,
    });
    res.status(200).json({
      status: "success",
      message: "A reset token has been sent to your email",
    });
  } catch (err) {
    user.resetToken = undefined;
    user.resetTokenExpDate = undefined;
    await user.save({ validateBeforeSave: false });
    next(new AppError("Unable to send token. Please try again", 404));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = req.params.resetToken;
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpDate: { $gte: Date.now() },
  });
  if (!user)
    return next(
      new AppError("Token is invalid or has expired. Please try again.", 401)
    );

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetToken = undefined;
  user.resetTokenExpDate = undefined;
  await user.save();

  const token = await signToken(user._id);

  res.status(201).json({
    status: "success",
    token,
  });
});
