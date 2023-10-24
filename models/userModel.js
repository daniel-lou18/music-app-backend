const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
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
  passwordChangedAt: Date,
  resetToken: String,
  resetTokenExpDate: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.passwordCorrect = async function (
  plainTextPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.methods.passwordChanged = function (tokenExpirationDate) {
  return (
    parseInt(this.passwordChangedAt.getTime() / 1000, 10) > tokenExpirationDate
  );
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.resetTokenExpDate = Date.now() + 10 * 60 * 1000;
  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
