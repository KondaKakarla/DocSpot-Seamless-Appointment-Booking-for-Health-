import React, { useCallback, useEffect, useState } from "react";
import { Button, message } from "antd";
import api from "../../api";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const emptyDays = () =>
  WEEKDAYS.map((label, dayOfWeek) => ({
    label,
    dayOfWeek,
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
  }));

const DoctorAvailability = () => {
  const [days, setDays] = useState(emptyDays);
  const [daysOff, setDaysOff] = useState([]);
  const [dayOffDate, setDayOffDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get("/doctor/getavailability");
      if (response.data.success) {
        const byDay = new Map(
          response.data.data.availability.map((item) => [item.dayOfWeek, item])
        );
        setDays(
          emptyDays().map((day) => {
            const interval = byDay.get(day.dayOfWeek);
            return interval
              ? {
                  ...day,
                  enabled: true,
                  startTime: interval.startTime,
                  endTime: interval.endTime,
                }
              : day;
          })
        );
        setDaysOff(response.data.data.daysOff || []);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Could not load availability");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateDay = (dayOfWeek, changes) => {
    setDays((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day
      )
    );
  };

  const addDayOff = () => {
    if (!dayOffDate || daysOff.includes(dayOffDate)) return;
    setDaysOff((current) => [...current, dayOffDate].sort());
    setDayOffDate("");
  };

  const save = async (event) => {
    event.preventDefault();
    const availability = days
      .filter((day) => day.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));
    setSaving(true);
    try {
      const response = await api.post("/doctor/updateavailability", {
        availability,
        daysOff,
      });
      if (response.data.success) message.success(response.data.message);
      else message.error(response.data.message);
    } catch (error) {
      message.error(error.response?.data?.message || "Could not save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4 text-center">Loading availability...</p>;

  return (
    <section className="container">
      <h2 className="p-3 text-center">Doctor Availability</h2>
      <p>Enable the days you accept appointments. Each appointment slot is 30 minutes.</p>
      <form onSubmit={save}>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr><th>Available</th><th>Day</th><th>From</th><th>Until</th></tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.dayOfWeek}>
                  <td>
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, { enabled: event.target.checked })
                      }
                      aria-label={`Enable ${day.label}`}
                    />
                  </td>
                  <td>{day.label}</td>
                  <td>
                    <input
                      className="form-control"
                      type="time"
                      value={day.startTime}
                      disabled={!day.enabled}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, { startTime: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="form-control"
                      type="time"
                      value={day.endTime}
                      disabled={!day.enabled}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, { endTime: event.target.value })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="day-off-date">Days off</label>
          <div className="d-flex gap-2">
            <input
              id="day-off-date"
              className="form-control"
              type="date"
              value={dayOffDate}
              onChange={(event) => setDayOffDate(event.target.value)}
            />
            <Button type="button" onClick={addDayOff}>Add day off</Button>
          </div>
          <ul className="mt-2">
            {daysOff.map((date) => (
              <li key={date}>
                {date}{" "}
                <button
                  type="button"
                  className="btn btn-sm btn-link"
                  onClick={() =>
                    setDaysOff((current) => current.filter((item) => item !== date))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        <Button htmlType="submit" type="primary" loading={saving}>
          Save availability
        </Button>
      </form>
    </section>
  );
};

export default DoctorAvailability;
