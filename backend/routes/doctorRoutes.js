const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const {
  updateDoctorProfileController,
  getDoctorAvailabilityController,
  updateDoctorAvailabilityController,
  getAllDoctorAppointmentsController,
  handleStatusController,
  handleRescheduleController,
  documentDownloadController,
} = require("../controllers/doctorC");

const router = express.Router();

router.post("/updateprofile", authMiddleware, requireRole("doctor"), updateDoctorProfileController);
router.get("/getavailability", authMiddleware, requireRole("doctor"), getDoctorAvailabilityController);
router.post("/updateavailability", authMiddleware, requireRole("doctor"), updateDoctorAvailabilityController);
router.get("/getdoctorappointments", authMiddleware, requireRole("doctor"), getAllDoctorAppointmentsController);
router.post("/handlestatus", authMiddleware, requireRole("doctor"), handleStatusController);
router.post("/handlerezchedule", authMiddleware, requireRole("doctor"), handleRescheduleController);
router.get("/getdocumentdownload", authMiddleware, documentDownloadController);

module.exports = router;
