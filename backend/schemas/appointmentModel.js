const mongoose = require("mongoose");

const appointmentModel = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    userInfo: { type: Object, default: {}, required: true },
    doctorInfo: { type: Object, default: {}, required: true },
    date: { type: String, required: true },
    document: { type: Object, default: null },
    reservesSlot: { type: Boolean, default: true },
    rescheduleRequest: {
      type: {
        date: { type: String },
        status: { type: String, enum: ["pending", "approved", "rejected"] },
        requestedAt: { type: Date },
      },
      default: null,
    },
    review: {
      type: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, maxlength: 1000 },
        submittedAt: { type: Date },
      },
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

appointmentModel.index(
  { doctorId: 1, date: 1 },
  { unique: true, partialFilterExpression: { reservesSlot: true } }
);

module.exports = mongoose.model("appointment", appointmentModel);
