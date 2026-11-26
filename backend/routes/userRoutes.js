const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const passwordResetRateLimit = require("../middlewares/passwordResetRateLimit");
const { upload } = require("../utils/upload");
const {
  registerController,
  registerDoctorController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  authController,
  docController,
  markNotificationReadController,
  deleteallnotificationController,
  getallnotificationController,
  getAllDoctorsControllers,
  getDoctorSlotsController,
  appointmentController,
  getAllUserAppointments,
  cancelAppointmentController,
  requestRescheduleController,
  reviewAppointmentController,
} = require("../controllers/userC");

const router = express.Router();

router.post("/register", registerController);
router.post("/registerdoctor", registerDoctorController);
router.post("/login", loginController);
router.post("/forgotpassword", passwordResetRateLimit, forgotPasswordController);
router.post("/resetpassword", resetPasswordController);

router.post("/getuserdata", authMiddleware, authController);
router.post("/registerdoc", authMiddleware, docController);
router.get("/getalldoctorsu", authMiddleware, getAllDoctorsControllers);
router.get("/getdoctorslots", authMiddleware, getDoctorSlotsController);
router.post(
  "/getappointment",
  authMiddleware,
  upload.single("image"),
  appointmentController
);
router.post("/cancelappointment", authMiddleware, cancelAppointmentController);
router.post("/requestreschedule", authMiddleware, requestRescheduleController);
router.post("/reviewappointment", authMiddleware, reviewAppointmentController);
router.post("/getallnotification", authMiddleware, getallnotificationController);
router.post("/marknotificationread", authMiddleware, markNotificationReadController);
router.post("/deleteallnotification", authMiddleware, deleteallnotificationController);
router.get("/getuserappointments", authMiddleware, getAllUserAppointments);

module.exports = router;
