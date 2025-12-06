import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await db.select().from(schema.notifications);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const notification = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, req.params.id));
    if (notification.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const newNotification = await db
      .insert(schema.notifications)
      .values(req.body)
      .returning();
    res.status(201).json(newNotification[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const updatedNotification = await db
      .update(schema.notifications)
      .set(req.body)
      .where(eq(schema.notifications.id, req.params.id))
      .returning();
    if (updatedNotification.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(updatedNotification[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const deletedNotification = await db
      .delete(schema.notifications)
      .where(eq(schema.notifications.id, req.params.id))
      .returning();
    if (deletedNotification.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
