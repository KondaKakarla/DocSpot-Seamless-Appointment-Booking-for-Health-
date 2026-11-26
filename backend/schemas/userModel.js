const mongoose = require("mongoose");

const capitalize = (value) =>
  typeof value === "string" && value.length
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : value;

const userModel = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      set: capitalize,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: [true, "password is required"] },
    phone: { type: String, required: [true, "phone is required"] },
    type: {
      type: String,
      required: [true, "type is required"],
      enum: ["user", "admin"],
      default: "user",
    },
    notification: { type: Array, default: [] },
    seennotification: { type: Array, default: [] },
    isdoctor: { type: Boolean, default: false },
    doctorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", null],
      default: null,
    },
    passwordResetTokenHash: { type: String, select: false, index: true },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userModel);
