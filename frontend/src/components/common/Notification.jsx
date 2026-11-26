import { Tabs, Empty, message } from "antd";
import React, { useState } from "react";
import api from "../../api";
import { setStoredUser } from "../../auth";

const NotificationList = ({ items, onMarkRead }) =>
  items && items.length > 0 ? (
    items.map((n, i) => (
      <div key={i} className="card mb-2">
        <div className="card-body py-2">
          <div className="card-text">{n.message}</div>
          {n.createdAt && (
            <small className="text-muted">{new Date(n.createdAt).toLocaleString()}</small>
          )}
          {onMarkRead && (
            <div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary mt-2"
                onClick={() => onMarkRead(i)}
              >
                Mark as read
              </button>
            </div>
          )}
        </div>
      </div>
    ))
  ) : (
    <Empty description="Nothing here" />
  );

const Notification = ({ user, onUserChange }) => {
  const [markingIndex, setMarkingIndex] = useState(null);
  const update = (data) => {
    setStoredUser(data);
    onUserChange(data);
  };

  const call = async (url) => {
    try {
      const res = await api.post(url, {});
      if (res.data.success) {
        update(res.data.data);
        message.success(res.data.message);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error("something went wrong");
    }
  };

  const markOneRead = async (notificationIndex) => {
    setMarkingIndex(notificationIndex);
    try {
      const res = await api.post("/user/marknotificationread", {
        notificationIndex,
      });
      if (res.data.success) {
        update(res.data.data);
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error(error.response?.data?.message || "Could not mark notification as read");
    } finally {
      setMarkingIndex(null);
    }
  };

  return (
    <div>
      <h2 className="p-3 text-center">Notification</h2>
      <Tabs
        items={[
          {
            key: "unread",
            label: `Unread (${user?.notification?.length || 0})`,
            children: (
              <>
                <div className="d-flex justify-content-end">
                  <h5 style={{ cursor: "pointer" }} onClick={() => call("/user/getallnotification")} className="p-2">
                    Mark all read
                  </h5>
                </div>
                <NotificationList
                  items={user?.notification}
                  onMarkRead={(index) => {
                    if (markingIndex === null) markOneRead(index);
                  }}
                />
              </>
            ),
          },
          {
            key: "read",
            label: "Read",
            children: (
              <>
                <div className="d-flex justify-content-end">
                  <h5 style={{ cursor: "pointer" }} onClick={() => call("/user/deleteallnotification")} className="p-2">
                    Delete all read
                  </h5>
                </div>
                <NotificationList items={user?.seennotification} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Notification;
