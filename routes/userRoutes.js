const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authControllers");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:resetToken", authController.resetPassword);

router
  .route("/")
  .get(authController.protect, userController.getAllUsers)
  .post(userController.createUser);

module.exports = router;
