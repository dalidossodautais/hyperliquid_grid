"use client";

import { useState, useEffect, useRef } from "react";
import Notification from "./Notification";

interface NotificationItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function NotificationContainer() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const nextId = useRef(1);

  const addNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    const id = nextId.current++;
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const handleAddNotification = (event: CustomEvent) => {
      addNotification(event.detail.message, event.detail.type);
    };

    window.addEventListener(
      "addNotification",
      handleAddNotification as EventListener
    );
    return () => {
      window.removeEventListener(
        "addNotification",
        handleAddNotification as EventListener
      );
    };
  }, []);

  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
}

// Export a function to add notifications from anywhere in the app
export const notify = (
  message: string,
  type: "success" | "error" | "info" = "info"
) => {
  const event = new CustomEvent("addNotification", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
};
