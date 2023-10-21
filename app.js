const express = require("express");
const morgan = require("morgan");
const userRouter = require("./routes/userRoutes");
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.use("/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Could not find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
