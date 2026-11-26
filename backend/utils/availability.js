const appointmentSchema = require("../schemas/appointmentModel");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_DURATION_MINUTES = 30;

const isValidDate = (date) => {
  if (!DATE_PATTERN.test(date || "")) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

const timeToMinutes = (time) => {
  const match = TIME_PATTERN.exec(time || "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const getDoctorSlots = async (doctor, date, excludeAppointmentId) => {
  if (!isValidDate(date) || doctor.daysOff?.includes(date)) return [];

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const schedule = Array.isArray(doctor.availability) && doctor.availability.length
    ? doctor.availability.filter((day) => day.dayOfWeek === dayOfWeek)
    : [{ startTime: doctor.timings?.[0], endTime: doctor.timings?.[1] }];

  const candidateSlots = new Set();
  for (const interval of schedule) {
    const start = timeToMinutes(interval.startTime);
    const end = timeToMinutes(interval.endTime);
    if (start === null || end === null || end <= start) continue;

    for (
      let minutes = start;
      minutes + SLOT_DURATION_MINUTES <= end;
      minutes += SLOT_DURATION_MINUTES
    ) {
      const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
      const remainder = String(minutes % 60).padStart(2, "0");
      candidateSlots.add(`${hours}:${remainder}`);
    }
  }

  const datePattern = new RegExp(`^${date} `);
  const exclude = excludeAppointmentId
    ? { _id: { $ne: excludeAppointmentId } }
    : {};
  const [appointments, requestedSlots] = await Promise.all([
    appointmentSchema
      .find({
        doctorId: doctor._id,
        status: { $in: ["pending", "approved"] },
        date: datePattern,
        ...exclude,
      })
      .select("date"),
    appointmentSchema
      .find({
        doctorId: doctor._id,
        status: { $in: ["pending", "approved"] },
        "rescheduleRequest.status": "pending",
        "rescheduleRequest.date": datePattern,
        ...exclude,
      })
      .select("rescheduleRequest.date"),
  ]);
  const busySlots = new Set([
    ...appointments.map((appointment) => appointment.date.slice(11, 16)),
    ...requestedSlots.map((appointment) =>
      appointment.rescheduleRequest.date.slice(11, 16)
    ),
  ]);
  const now = new Date();

  return [...candidateSlots]
    .filter((slot) => {
      const slotDate = new Date(`${date}T${slot}:00`);
      return slotDate > now && !busySlots.has(slot);
    })
    .sort();
};

const isValidAppointmentDateTime = (value) => {
  if (typeof value !== "string") return false;
  const match = /^(\d{4}-\d{2}-\d{2}) ([0-2]\d:[0-5]\d)$/.exec(value);
  if (!match || !isValidDate(match[1])) return false;
  const hour = Number(match[2].slice(0, 2));
  const minute = Number(match[2].slice(3, 5));
  return hour < 24 && minute < 60 && new Date(`${match[1]}T${match[2]}:00`) > new Date();
};

module.exports = {
  getDoctorSlots,
  isValidAppointmentDateTime,
  isValidDate,
};
