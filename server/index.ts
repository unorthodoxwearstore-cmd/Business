import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSignup, handleOwnerSignin, handleStaffSignin } from "./routes/auth";
import { getNotifications, postNotification, patchNotification, markAllRead } from "./routes/notifications";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/owner-signin", handleOwnerSignin);
  app.post("/api/auth/staff-signin", handleStaffSignin);

  // Notifications API
  app.post("/api/notifications", postNotification);
  app.get("/api/notifications", getNotifications);
  app.patch("/api/notifications/:id", patchNotification);
  app.post("/api/notifications/mark-all-read", markAllRead);

  return app;
}
