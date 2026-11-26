const mongoose = require("mongoose");
const docSchema = require("../schemas/docModel");
const userSchema = require("../schemas/userModel");
const appointmentSchema = require("../schemas/appointmentModel");
const notify = require("../utils/notify");

const serverError = (res, error) => {
  console.error(error);
  return res
    .status(500)
    .send({ message: "something went wrong", success: false });
};

const getAllUsersControllers = async (req, res) => {
  try {
    const users = await userSchema.find({}).select("-password");
    return res
      .status(200)
      .send({ message: "Users data list", success: true, data: users });
  } catch (error) {
    return serverError(res, error);
  }
};

const getAllDoctorsControllers = async (req, res) => {
  try {
    const docUsers = await docSchema.find({}).sort({ createdAt: -1 });
    return res.status(200).send({
      message: "doctor Users data list",
      success: true,
      data: docUsers,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const changeDoctorStatus = (status) => async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).send({ message: "Invalid doctor", success: false });
    }
    const doctor = await docSchema.findByIdAndUpdate(
      doctorId,
      { status },
      { new: true }
    );
    if (!doctor) {
      return res
        .status(404)
        .send({ message: "Doctor not found", success: false });
    }

    if (doctor.userId) {
      await userSchema.findByIdAndUpdate(doctor.userId, {
        isdoctor: status === "approved",
        doctorStatus: status,
      });
      await notify(doctor.userId, {
        type: "doctor-account-" + status,
        message: `Your Doctor account has been ${status}`,
      });
    }

    return res.status(200).send({
      message: `Doctor ${status} successfully!`,
      success: true,
      data: doctor,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const getStatusApproveController = changeDoctorStatus("approved");
const getStatusRejectController = changeDoctorStatus("rejected");

const displayAllAppointmentController = async (req, res) => {
  try {
    const allAppointments = await appointmentSchema
      .find()
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "successfully fetched All Appointments",
      data: allAppointments,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const getDashboardSummaryController = async (req, res) => {
  try {
    const [userCount, doctorCount, pendingApplications, appointmentCount] =
      await Promise.all([
        userSchema.countDocuments({ type: "user" }),
        docSchema.countDocuments({ status: "approved" }),
        docSchema.countDocuments({ status: "pending" }),
        appointmentSchema.countDocuments({}),
      ]);
    return res.status(200).send({
      success: true,
      data: { userCount, doctorCount, pendingApplications, appointmentCount },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  getAllDoctorsControllers,
  getAllUsersControllers,
  getStatusApproveController,
  getStatusRejectController,
  displayAllAppointmentController,
  getDashboardSummaryController,
};
