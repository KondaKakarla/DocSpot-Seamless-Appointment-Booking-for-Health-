const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const docSchema = require("../schemas/docModel");
const appointmentSchema = require("../schemas/appointmentModel");
const userSchema = require("../schemas/userModel");
const notify = require("../utils/notify");
const { uploadsDir } = require("../utils/upload");
const { getDoctorSlots, isValidDate } = require("../utils/availability");

const serverError = (res, error) => {
  console.error(error);
  return res
    .status(500)
    .send({ message: "something went wrong", success: false });
};

const updateDoctorProfileController = async (req, res) => {
  try {
    const allowed = ["phone", "address", "specialization", "experience", "fees", "timings"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const doctor = await docSchema.findOneAndUpdate(
      { userId: req.userId },
      updates,
      { new: true }
    );
    if (!doctor) {
      return res
        .status(404)
        .send({ success: false, message: "Doctor profile not found" });
    }
    return res.status(200).send({
      success: true,
      data: doctor,
      message: "successfully updated profile",
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const getDoctorAvailabilityController = async (req, res) => {
  try {
    const doctor = await docSchema.findOne({ userId: req.userId });
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor profile not found",
      });
    }
    const availability = doctor.availability.length
      ? doctor.availability
      : Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          startTime: doctor.timings?.[0] || "",
          endTime: doctor.timings?.[1] || "",
        }));
    return res.status(200).send({
      success: true,
      data: { availability, daysOff: doctor.daysOff },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const updateDoctorAvailabilityController = async (req, res) => {
  try {
    const { availability, daysOff } = req.body;
    if (
      !Array.isArray(availability) ||
      availability.some((day) =>
        !day ||
        !Number.isInteger(day.dayOfWeek) ||
        day.dayOfWeek < 0 ||
        day.dayOfWeek > 6 ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime || "") ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.endTime || "") ||
        day.endTime <= day.startTime
      ) ||
      new Set(availability.map((day) => day.dayOfWeek)).size !== availability.length ||
      !Array.isArray(daysOff) ||
      daysOff.length > 100 ||
      daysOff.some((date) => !isValidDate(date))
    ) {
      return res.status(400).send({
        success: false,
        message: "Enter valid weekly hours and days off",
      });
    }

    const doctor = await docSchema.findOne({ userId: req.userId });
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor profile not found",
      });
    }
    doctor.availability = availability;
    doctor.daysOff = [...new Set(daysOff)];
    if (availability.length) {
      doctor.timings = [availability[0].startTime, availability[0].endTime];
    }
    await doctor.save();

    return res.status(200).send({
      success: true,
      message: "Availability updated",
      data: { availability: doctor.availability, daysOff: doctor.daysOff },
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const getAllDoctorAppointmentsController = async (req, res) => {
  try {
    const doctor = await docSchema.findOne({ userId: req.userId });
    if (!doctor) {
      return res.status(200).send({
        message: "No doctor profile found",
        success: true,
        data: [],
      });
    }
    const allAppointments = await appointmentSchema
      .find({ doctorId: doctor._id })
      .sort({ createdAt: -1 });

    return res.status(200).send({
      message: "All the appointments are listed below.",
      success: true,
      data: allAppointments,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const handleStatusController = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    if (!["approved", "rejected", "completed"].includes(status)) {
      return res.status(400).send({ message: "Invalid status", success: false });
    }
    if (!mongoose.isValidObjectId(appointmentId)) {
      return res
        .status(400)
        .send({ message: "Invalid appointment", success: false });
    }

    const doctor = await docSchema.findOne({ userId: req.userId });
    const appointment = doctor
      ? await appointmentSchema.findOne({
          _id: appointmentId,
          doctorId: doctor._id,
        })
      : null;

    if (!appointment) {
      return res
        .status(404)
        .send({ message: "Appointment not found", success: false });
    }

    appointment.status = status;
    appointment.reservesSlot = ["pending", "approved"].includes(status);
    if (status !== "approved" && appointment.rescheduleRequest?.status === "pending") {
      appointment.rescheduleRequest.status = "rejected";
    }
    await appointment.save();

    await notify(appointment.userId, {
      type: "status-updated",
      message: `Your appointment with Dr. ${doctor.fullName} on ${appointment.date} has been ${status}`,
    });

    return res
      .status(200)
      .send({ success: true, message: "successfully updated" });
  } catch (error) {
    return serverError(res, error);
  }
};

const handleRescheduleController = async (req, res) => {
  try {
    const { appointmentId, decision } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).send({
        success: false,
        message: "Choose approve or reject",
      });
    }
    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid appointment",
      });
    }

    const doctor = await docSchema.findOne({ userId: req.userId });
    const appointment = doctor
      ? await appointmentSchema.findOne({
          _id: appointmentId,
          doctorId: doctor._id,
          status: { $in: ["pending", "approved"] },
        })
      : null;
    if (!appointment || appointment.rescheduleRequest?.status !== "pending") {
      return res.status(404).send({
        success: false,
        message: "Reschedule request not found",
      });
    }

    if (decision === "approved") {
      const [date, time] = appointment.rescheduleRequest.date.split(" ");
      const availableSlots = await getDoctorSlots(doctor, date, appointment._id);
      if (!availableSlots.includes(time)) {
        return res.status(409).send({
          success: false,
          message: "That slot is no longer available. Reject the request and ask the patient to choose another.",
        });
      }
      appointment.date = appointment.rescheduleRequest.date;
    }
    appointment.rescheduleRequest.status = decision;
    await appointment.save();

    await notify(appointment.userId, {
      type: "reschedule-response",
      message: decision === "approved"
        ? `Your reschedule request was approved. New appointment: ${appointment.date}`
        : `Your reschedule request for ${appointment.rescheduleRequest.date} was rejected.`,
    });
    return res.status(200).send({
      success: true,
      message: `Reschedule request ${decision}`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send({
        success: false,
        message: "That slot was just booked. Please reject the request.",
      });
    }
    return serverError(res, error);
  }
};

const documentDownloadController = async (req, res) => {
  try {
    const { appointId } = req.query;
    if (!mongoose.isValidObjectId(appointId)) {
      return res
        .status(400)
        .send({ message: "Invalid appointment", success: false });
    }
    const appointment = await appointmentSchema.findById(appointId);
    if (!appointment) {
      return res
        .status(404)
        .send({ message: "Appointment not found", success: false });
    }

    // Only the patient, the doctor, or an admin may download
    const requester = await userSchema.findById(req.userId).select("type");
    const isPatient = String(appointment.userId) === String(req.userId);
    const isDoctor = String(appointment.doctorInfo?.userId) === String(req.userId);
    const isAdmin = requester?.type === "admin";
    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).send({ message: "Access denied", success: false });
    }

    const storedName = appointment.document?.storedName
      || (appointment.document?.path && path.basename(appointment.document.path));
    if (!storedName) {
      return res
        .status(404)
        .send({ message: "No document attached", success: false });
    }

    const absoluteFilePath = path.join(uploadsDir, path.basename(storedName));
    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).send({ message: "File not found", success: false });
    }

    return res.download(
      absoluteFilePath,
      appointment.document.filename || path.basename(absoluteFilePath)
    );
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  updateDoctorProfileController,
  getDoctorAvailabilityController,
  updateDoctorAvailabilityController,
  getAllDoctorAppointmentsController,
  handleStatusController,
  handleRescheduleController,
  documentDownloadController,
};
