import { RequestHandler } from "express";

interface AppNotification {
  id: string;
  type: "production" | "inventory" | "recipe" | "info";
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

const notifications: AppNotification[] = [];

export const postNotification: RequestHandler = (req, res) => {
  const { type, title, message, link } = req.body || {};
  if (!type || !title || !message) {
    return res.status(400).json({ error: "type, title and message are required" });
  }
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const item: AppNotification = {
    id,
    type,
    title,
    message,
    link,
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(item);
  res.json(item);
};

export const getNotifications: RequestHandler = (req, res) => {
  const unread = req.query.unread === "true";
  const list = unread ? notifications.filter((n) => !n.read) : notifications;
  res.json(list);
};

export const patchNotification: RequestHandler = (req, res) => {
  const { id } = req.params;
  const { read } = req.body || {};
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  if (typeof read === "boolean") notifications[idx].read = read;
  res.json(notifications[idx]);
};

export const markAllRead: RequestHandler = (_req, res) => {
  notifications.forEach((n) => (n.read = true));
  res.json({ success: true });
};
