const router = require("express").Router();
const { userTokenAuth } = require("../../middlewares/user");
const {
  userRegistration,
  verifyEmail,
  resendOtp,
  getUserDetail,
  editProfile
} = require("../../controllers/app/userController");
const {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
} = require("../../controllers/app/authController");
const { createAppointment, updateAppointment, getAppointments } = require("../../controllers/app/appointmentController");

// Authentication Routes
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// User Routes
router.post("/register", userRegistration);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.post("/logout", logout);
router.put("/change-password", userTokenAuth, changePassword);
router.put("/edit-profile", userTokenAuth, editProfile);
router.get("/user-detail", userTokenAuth, getUserDetail);

// Appointment Routes
router.post("/appointments", userTokenAuth,createAppointment);
router.put("/appointments/:id", userTokenAuth, updateAppointment);
router.get("/appointments", userTokenAuth, getAppointments);


module.exports = router;
