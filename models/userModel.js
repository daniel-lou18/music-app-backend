const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const AppError = require("../utils/AppError");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: `user`,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "A user must have an email"],
    validate: {
      validator: function (val) {
        return validator.isEmail(val);
      },
      message: "Please provide a valid email",
    },
  },
  password: {
    type: String,
    select: false,
    required: [true, "Please provide a password"],
    minLength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (val) {
        return this.password === val;
      },
      message: "Password and password confirmation are not identical",
    },
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified()) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
