const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const {
  getAllUsersControllers,
  getAllDoctorsControllers,
  getStatusApproveController,
  getStatusRejectController,
  displayAllAppointmentController,
  getDashboardSummaryController,
} = require("../controllers/adminC");

const router = express.Router();
router.use(authMiddleware, requireRole("admin"));

router.get("/getallusers", getAllUsersControllers);
router.get("/getalldoctors", getAllDoctorsControllers);
router.post("/getapprove", getStatusApproveController);
router.post("/getreject", getStatusRejectController);
router.get("/getallAppointmentsAdmin", displayAllAppointmentController);
router.get("/summary", getDashboardSummaryController);

module.exports = router;
