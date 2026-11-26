const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const userSchema = require("../schemas/userModel");
const docSchema = require("../schemas/docModel");
const appointmentSchema = require("../schemas/appointmentModel");
const notify = require("../utils/notify");
const { isConfigured, sendPasswordResetEmail } = require("../utils/mailer");
const {
  getDoctorSlots,
  isValidAppointmentDateTime,
  isValidDate,
} = require("../utils/availability");

const serverError = (res, error, message = "something went wrong") => {
  console.error(error);
  return res.status(500).send({ success: false, message });
};

const publicUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

/// register
const registerController = async (req, res) => {
  try {
    let { fullName, email, password, phone, type } = req.body;
    if (!fullName || !email || !password || !phone) {
      return res
        .status(400)
        .send({ message: "All fields are required", success: false });
    }
    if (String(password).length < 6) {
      return res.status(400).send({
        message: "Password must be at least 6 characters",
        success: false,
      });
    }
    email = String(email).toLowerCase().trim();

    if (await userSchema.findOne({ email })) {
      return res
        .status(200)
        .send({ message: "User already exists", success: false });
    }

    // Only the very first account may become an admin (bootstrap).
    // After that, everyone who registers is a normal user.
    type = type === "admin" ? "admin" : "user";
    if (type === "admin" && (await userSchema.exists({ type: "admin" }))) {
      return res.status(200).send({
        message: "An admin already exists. Please register as a user.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    await new userSchema({
      fullName,
      email,
      password: hashedPassword,
      phone,
      type,
    }).save();

    return res.status(201).send({ message: "Register Success", success: true });
  } catch (error) {
    return serverError(res, error, error.message);
  }
};

/// login
const loginController = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.status(200).send({ message: "User not found", success: false });
    }
    const isMatch = await bcrypt.compare(
      String(req.body.password || ""),
      user.password
    );
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid email or password", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, {
      expiresIn: "1d",
    });
    return res.status(200).send({
      message: "Login success successfully",
      success: true,
      token,
      userData: publicUser(user),
    });
  } catch (error) {
    return serverError(res, error, error.message);
  }
};

const forgotPasswordController = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).send({
        success: false,
        message: "Enter a valid email address",
      });
    }
    if (!isConfigured()) {
      return res.status(503).send({
        success: false,
        message: "Password reset email is not configured. Contact the administrator.",
      });
    }

    const user = await userSchema.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.passwordResetTokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      const frontendUrl = (
        process.env.FRONTEND_URL || "http://localhost:3000"
      ).replace(/\/+$/, "");
      try {
        await sendPasswordResetEmail(
          email,
          `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`
        );
      } catch (error) {
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        console.error("Could not send password reset email:", error);
        return res.status(503).send({
          success: false,
          message: "Could not send the reset email. Please try again later.",
        });
      }
    }

    return res.status(200).send({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    return serverError(res, error, "Could not process password reset request");
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).send({
        success: false,
        message: "Invalid or expired reset link",
      });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await userSchema
      .findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      })
      .select("+passwordResetTokenHash +passwordResetExpires");
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).send({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    return serverError(res, error, "Could not reset password");
  }
};

/// current user (fresh data)
const authController = async (req, res) => {
  try {
    const user = await userSchema.findById(req.userId);
    if (!user) {
      return res.status(200).send({ message: "user not found", success: false });
    }
    return res.status(200).send({ success: true, data: publicUser(user) });
  } catch (error) {
    return serverError(res, error, "auth error");
  }
};

/// apply to become a doctor
const docController = async (req, res) => {
  try {
    const { doctor } = req.body;
    if (!doctor) {
      return res
        .status(400)
        .send({ success: false, message: "Doctor details are required" });
    }

    const existing = await docSchema.findOne({
      userId: req.userId,
      status: { $in: ["pending", "approved"] },
    });
    if (existing) {
      return res.status(200).send({
        success: false,
        message:
          existing.status === "approved"
            ? "You are already a registered doctor"
            : "Your application is already pending approval",
      });
    }

    const newDoctor = new docSchema({
      fullName: doctor.fullName,
      email: doctor.email,
      phone: doctor.phone,
      address: doctor.address,
      specialization: doctor.specialization,
      experience: doctor.experience,
      fees: doctor.fees,
      timings: doctor.timings,
      availability: doctor.availability || Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        startTime: doctor.timings?.[0],
        endTime: doctor.timings?.[1],
      })),
      userId: req.userId,
      status: "pending",
    });
    await newDoctor.save();
    await userSchema.findByIdAndUpdate(req.userId, { doctorStatus: "pending" });

    const admins = await userSchema.find({ type: "admin" }).select("_id");
    await Promise.all(
      admins.map((a) =>
        notify(a._id, {
          type: "apply-doctor-request",
          message: `${newDoctor.fullName} has applied for doctor registration`,
        })
      )
    );

    return res.status(201).send({
      success: true,
      message: "Doctor Registration request sent successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).send({ success: false, message: error.message });
    }
    return serverError(res, error, "Error while applying");
  }
};

/// register or apply as a doctor without first signing in
const registerDoctorController = async (req, res) => {
  let createdUser;
  let applicationSaved = false;
  try {
    const {
      fullName,
      email: rawEmail,
      password,
      phone,
      address,
      specialization,
      experience,
      fees,
      timings,
      availability,
    } = req.body;
    const email = String(rawEmail || "").toLowerCase().trim();

    if (
      !fullName || !email || !password || !phone || !address ||
      !specialization || experience === undefined || fees === undefined ||
      !Array.isArray(timings) || timings.length !== 2
    ) {
      return res.status(400).send({
        success: false,
        message: "Please provide all personal and professional details",
      });
    }
    const doctorAvailability = availability || Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startTime: timings[0],
      endTime: timings[1],
    }));
    if (
      !Array.isArray(doctorAvailability) ||
      doctorAvailability.some((day) =>
        !day ||
        !Number.isInteger(day.dayOfWeek) ||
        day.dayOfWeek < 0 ||
        day.dayOfWeek > 6 ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.startTime || "") ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.endTime || "") ||
        day.endTime <= day.startTime
      ) ||
      new Set(doctorAvailability.map((day) => day.dayOfWeek)).size !== doctorAvailability.length
    ) {
      return res.status(400).send({
        success: false,
        message: "Invalid doctor availability schedule",
      });
    }
    if (String(password).length < 6) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    let user = await userSchema.findOne({ email });
    if (user) {
      if (user.type === "admin") {
        return res.status(409).send({
          success: false,
          message: "This email belongs to an admin account",
        });
      }
      if (!(await bcrypt.compare(String(password), user.password))) {
        return res.status(409).send({
          success: false,
          message: "An account already uses this email. Enter its password to apply.",
        });
      }
      if (user.isdoctor) {
        return res.status(409).send({
          success: false,
          message: "This account is already an approved doctor",
        });
      }
      if (user.doctorStatus === "pending") {
        return res.status(409).send({
          success: false,
          message: "Your doctor application is already pending approval",
        });
      }
    } else {
      user = new userSchema({
        fullName,
        email,
        password: await bcrypt.hash(String(password), 10),
        phone,
        type: "user",
        doctorStatus: "pending",
      });
      await user.save();
      createdUser = user;
    }

    const existingApplication = await docSchema.findOne({ userId: user._id });
    const doctorDetails = {
      fullName,
      email,
      phone,
      address,
      specialization,
      experience: String(experience),
      fees: Number(fees),
      timings,
      availability: doctorAvailability,
      userId: user._id,
      status: "pending",
    };

    if (existingApplication) {
      Object.assign(existingApplication, doctorDetails);
      await existingApplication.save();
    } else {
      await new docSchema(doctorDetails).save();
    }
    applicationSaved = true;

    if (!createdUser) {
      user.doctorStatus = "pending";
      await user.save();
    }

    const admins = await userSchema.find({ type: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        notify(admin._id, {
          type: "apply-doctor-request",
          message: `${fullName} has applied for doctor registration`,
        })
      )
    );

    return res.status(201).send({
      success: true,
      message: "Doctor application submitted. Log in to track its status.",
    });
  } catch (error) {
    if (createdUser && !applicationSaved) {
      try {
        await createdUser.deleteOne();
      } catch (cleanupError) {
        console.error("Could not remove incomplete doctor applicant account", cleanupError);
      }
    }
    if (error.name === "ValidationError") {
      return res.status(400).send({ success: false, message: error.message });
    }
    return serverError(res, error, "Error while applying");
  }
};

/// mark all unread notifications as read
const getallnotificationController = async (req, res) => {
  try {
    const user = await userSchema.findById(req.userId);
    user.seennotification.push(...user.notification);
    user.notification = [];
    const updatedUser = await user.save();
    return res.status(200).send({
      success: true,
      message: "All notification marked as read",
      data: publicUser(updatedUser),
    });
  } catch (error) {
    return serverError(res, error, "unable to fetch");
  }
};

/// mark one unread notification as read
const markNotificationReadController = async (req, res) => {
  try {
    const { notificationIndex } = req.body;
    if (!Number.isInteger(notificationIndex) || notificationIndex < 0) {
      return res.status(400).send({
        success: false,
        message: "Invalid notification",
      });
    }

    const user = await userSchema.findById(req.userId);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }
    if (notificationIndex >= user.notification.length) {
      return res.status(404).send({
        success: false,
        message: "Notification not found",
      });
    }

    const [notification] = user.notification.splice(notificationIndex, 1);
    user.seennotification.push(notification);
    const updatedUser = await user.save();
    return res.status(200).send({
      success: true,
      message: "Notification marked as read",
      data: publicUser(updatedUser),
    });
  } catch (error) {
    return serverError(res, error, "Unable to mark notification as read");
  }
};

/// delete all read notifications (unread ones are kept)
const deleteallnotificationController = async (req, res) => {
  try {
    const user = await userSchema.findById(req.userId);
    user.seennotification = [];
    const updatedUser = await user.save();
    return res.status(200).send({
      success: true,
      message: "notification deleted",
      data: publicUser(updatedUser),
    });
  } catch (error) {
    return serverError(res, error, "unable to delete");
  }
};

/// approved doctors for patients
const getAllDoctorsControllers = async (req, res) => {
  try {
    const docUsers = await docSchema.find({ status: "approved" }).lean();
    const reviews = await appointmentSchema.aggregate([
      {
        $match: {
          doctorId: { $in: docUsers.map((doctor) => doctor._id) },
          "review.rating": { $gte: 1, $lte: 5 },
        },
      },
      {
        $group: {
          _id: "$doctorId",
          averageRating: { $avg: "$review.rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    const reviewByDoctor = new Map(
      reviews.map((review) => [String(review._id), review])
    );
    return res.status(200).send({
      message: "doctor Users data list",
      success: true,
      data: docUsers.map((doctor) => {
        const review = reviewByDoctor.get(String(doctor._id));
        return {
          ...doctor,
          averageRating: review?.averageRating || 0,
          reviewCount: review?.reviewCount || 0,
        };
      }),
    });
  } catch (error) {
    return serverError(res, error);
  }
};

const getDoctorSlotsController = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!mongoose.isValidObjectId(doctorId) || !isValidDate(date)) {
      return res.status(400).send({
        success: false,
        message: "A valid doctor and date are required",
      });
    }
    const doctor = await docSchema.findOne({
      _id: doctorId,
      status: "approved",
    });
    if (!doctor) {
      return res.status(404).send({
        success: false,
        message: "Doctor not available",
      });
    }
    const slots = await getDoctorSlots(doctor, date);
    return res.status(200).send({ success: true, data: slots });
  } catch (error) {
    return serverError(res, error);
  }
};

/// book an appointment
const appointmentController = async (req, res) => {
  try {
    const { doctorId, date } = req.body;

    if (!doctorId || !mongoose.isValidObjectId(doctorId)) {
      return res
        .status(400)
        .send({ message: "A valid doctor is required", success: false });
    }
    if (!isValidAppointmentDateTime(date)) {
      return res
        .status(400)
        .send({ message: "Please choose a valid future date and time", success: false });
    }

    const [user, doctor] = await Promise.all([
      userSchema.findById(req.userId),
      docSchema.findById(doctorId),
    ]);

    if (!user) {
      return res.status(404).send({ message: "User not found", success: false });
    }
    if (!doctor || doctor.status !== "approved") {
      return res
        .status(404)
        .send({ message: "Doctor not available", success: false });
    }
    if (String(doctor.userId) === String(user._id)) {
      return res.status(400).send({
        message: "You cannot book an appointment with yourself",
        success: false,
      });
    }

    const [dateKey, time] = date.split(" ");
    const availableSlots = await getDoctorSlots(doctor, dateKey);
    if (!availableSlots.includes(time)) {
      return res.status(409).send({
        message: "That time is unavailable. Please choose another available slot.",
        success: false,
      });
    }

    const documentData = req.file
      ? {
          filename: req.file.originalname,
          storedName: req.file.filename,
          path: `/uploads/${req.file.filename}`,
        }
      : null;

    await new appointmentSchema({
      userId: user._id,
      doctorId: doctor._id,
      userInfo: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
      doctorInfo: {
        _id: doctor._id,
        userId: doctor.userId,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        phone: doctor.phone,
        email: doctor.email,
      },
      date,
      document: documentData,
      status: "pending",
    }).save();

    await notify(doctor.userId, {
      type: "New Appointment",
      message: `New Appointment request from ${user.fullName} on ${date}`,
    });

    return res
      .status(200)
      .send({ message: "Appointment booked successfully", success: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send({
        message: "That time was just booked. Please choose another slot.",
        success: false,
      });
    }
    return serverError(res, error);
  }
};

/// appointments booked by the logged-in user
const getAllUserAppointments = async (req, res) => {
  try {
    const allAppointments = await appointmentSchema
      .find({ userId: req.userId })
      .sort({ createdAt: -1 });

    const data = allAppointments.map((a) => ({
      ...a.toObject(),
      docName: a.doctorInfo?.fullName || "",
    }));

    return res.status(200).send({
      message: "All the appointments are listed below.",
      success: true,
      data,
    });
  } catch (error) {
    return serverError(res, error);
  }
};

/// patient cancels their own appointment
const cancelAppointmentController = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!mongoose.isValidObjectId(appointmentId)) {
      return res
        .status(400)
        .send({ message: "Invalid appointment", success: false });
    }
    const appointment = await appointmentSchema.findOne({
      _id: appointmentId,
      userId: req.userId,
    });
    if (!appointment) {
      return res
        .status(404)
        .send({ message: "Appointment not found", success: false });
    }
    if (!["pending", "approved"].includes(appointment.status)) {
      return res.status(200).send({
        message: `Cannot cancel an appointment that is ${appointment.status}`,
        success: false,
      });
    }
    appointment.status = "cancelled";
    appointment.reservesSlot = false;
    if (appointment.rescheduleRequest?.status === "pending") {
      appointment.rescheduleRequest.status = "rejected";
    }
    await appointment.save();

    await notify(appointment.doctorInfo?.userId, {
      type: "status-updated",
      message: `${appointment.userInfo?.fullName} cancelled the appointment on ${appointment.date}`,
    });

    return res
      .status(200)
      .send({ message: "Appointment cancelled", success: true });
  } catch (error) {
    return serverError(res, error);
  }
};

const requestRescheduleController = async (req, res) => {
  try {
    const { appointmentId, date } = req.body;
    if (!mongoose.isValidObjectId(appointmentId) || !isValidAppointmentDateTime(date)) {
      return res.status(400).send({
        success: false,
        message: "Choose a valid future appointment slot",
      });
    }

    const appointment = await appointmentSchema.findOne({
      _id: appointmentId,
      userId: req.userId,
      status: { $in: ["pending", "approved"] },
    });
    if (!appointment) {
      return res.status(404).send({
        success: false,
        message: "Appointment not found or cannot be rescheduled",
      });
    }
    if (appointment.date === date) {
      return res.status(400).send({
        success: false,
        message: "Choose a different appointment time",
      });
    }
    if (appointment.rescheduleRequest?.status === "pending") {
      return res.status(409).send({
        success: false,
        message: "A reschedule request is already waiting for the doctor",
      });
    }

    const doctor = await docSchema.findOne({
      _id: appointment.doctorId,
      status: "approved",
    });
    if (!doctor) {
      return res.status(404).send({ success: false, message: "Doctor not available" });
    }
    const [dateKey, time] = date.split(" ");
    const availableSlots = await getDoctorSlots(doctor, dateKey, appointment._id);
    if (!availableSlots.includes(time)) {
      return res.status(409).send({
        success: false,
        message: "That slot is unavailable. Please choose another available time.",
      });
    }

    appointment.rescheduleRequest = {
      date,
      status: "pending",
      requestedAt: new Date(),
    };
    await appointment.save();
    await notify(doctor.userId, {
      type: "reschedule-request",
      message: `${appointment.userInfo?.fullName || "A patient"} requested to reschedule to ${date}`,
    });
    return res.status(200).send({
      success: true,
      message: "Reschedule request sent to the doctor",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send({
        success: false,
        message: "That slot was just booked. Please choose another.",
      });
    }
    return serverError(res, error);
  }
};

const reviewAppointmentController = async (req, res) => {
  try {
    const { appointmentId, rating, comment = "" } = req.body;
    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).send({ success: false, message: "Invalid appointment" });
    }
    const normalizedRating = Number(rating);
    const normalizedComment = String(comment).trim();
    if (
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5 ||
      normalizedComment.length > 1000
    ) {
      return res.status(400).send({
        success: false,
        message: "Rating must be 1-5 and comment must be under 1000 characters",
      });
    }

    const appointment = await appointmentSchema.findOneAndUpdate(
      {
        _id: appointmentId,
        userId: req.userId,
        status: "completed",
        review: null,
      },
      {
        $set: {
          review: {
            rating: normalizedRating,
            comment: normalizedComment,
            submittedAt: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!appointment) {
      const existing = await appointmentSchema.findOne({
        _id: appointmentId,
        userId: req.userId,
      }).select("_id status review");
      if (existing?.review) {
        return res.status(409).send({
          success: false,
          message: "This appointment has already been reviewed",
        });
      }
      return res.status(404).send({
        success: false,
        message: "Only your completed appointments can be reviewed",
      });
    }
    return res.status(201).send({
      success: true,
      message: "Review submitted",
    });
  } catch (error) {
    return serverError(res, error);
  }
};

module.exports = {
  registerController,
  registerDoctorController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  authController,
  docController,
  markNotificationReadController,
  getallnotificationController,
  deleteallnotificationController,
  getAllDoctorsControllers,
  getDoctorSlotsController,
  appointmentController,
  getAllUserAppointments,
  cancelAppointmentController,
  requestRescheduleController,
  reviewAppointmentController,
};
