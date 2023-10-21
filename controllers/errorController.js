const e = require("express");
const AppError = require("../utils/AppError");

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("🚨", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const handleValidationError = (err) => {
  const message = Object.values(err.errors)
    .map((el) => el.message)
    .join(". ");
  return new AppError(message, 400);
};

const handleDuplicateError = (err) =>
  new AppError(
    `Duplicate value(s) for: ${Object.keys(err.keyValue).join(", ")}`,
    400
  );

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") sendErrorDev(err, res);
  if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message, name: err.name };
    if (error.name === "ValidationError") error = handleValidationError(error);
    if (error.code === 11000) error = handleDuplicateError(error);
    sendErrorProd(error, res);
  }
};
