import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";

export const getAllRestockOrders = async (req, res) => {
  try {
    const restockOrders = await db.select().from(schema.restockOrders);
    res.json(restockOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRestockOrderById = async (req, res) => {
  try {
    const restockOrder = await db
      .select()
      .from(schema.restockOrders)
      .where(eq(schema.restockOrders.id, req.params.id));
    if (restockOrder.length === 0) {
      return res.status(404).json({ message: "Restock order not found" });
    }
    res.json(restockOrder[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRestockOrder = async (req, res) => {
  try {
    const newRestockOrder = await db
      .insert(schema.restockOrders)
      .values(req.body)
      .returning();
    res.status(201).json(newRestockOrder[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRestockOrder = async (req, res) => {
  try {
    const updatedRestockOrder = await db
      .update(schema.restockOrders)
      .set(req.body)
      .where(eq(schema.restockOrders.id, req.params.id))
      .returning();
    if (updatedRestockOrder.length === 0) {
      return res.status(404).json({ message: "Restock order not found" });
    }
    res.json(updatedRestockOrder[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRestockOrder = async (req, res) => {
  try {
    const deletedRestockOrder = await db
      .delete(schema.restockOrders)
      .where(eq(schema.restockOrders.id, req.params.id))
      .returning();
    if (deletedRestockOrder.length === 0) {
      return res.status(404).json({ message: "Restock order not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
