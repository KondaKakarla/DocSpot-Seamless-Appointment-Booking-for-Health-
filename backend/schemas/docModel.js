const mongoose = require("mongoose");

const capitalize = (value) =>
  typeof value === "string" && value.length
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value;

const docModel = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    fullName: {
      type: String,
      required: [true, "full Name is required"],
      trim: true,
      set: capitalize,
    },
    email: { type: String, required: [true, "email is required"] },
    phone: { type: String, required: [true, "phone is required"] },
    address: { type: String, required: [true, "address is required"] },
    specialization: {
      type: String,
      required: [true, "specialization is required"],
    },
    experience: { type: String, required: [true, "experience is required"] },
    fees: { type: Number, required: [true, "fees is required"] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    timings: { type: Array, required: [true, "work time required"] },
    availability: {
      type: [
        {
          dayOfWeek: { type: Number, min: 0, max: 6, required: true },
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
        },
      ],
      default: [],
    },
    daysOff: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("doctor", docModel);
