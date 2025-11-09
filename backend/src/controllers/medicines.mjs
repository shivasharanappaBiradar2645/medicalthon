import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";

export const getAllMedicines = async (req, res) => {
  try {
    const medicines = await db.select().from(schema.medicines);
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const medicine = await db
      .select()
      .from(schema.medicines)
      .where(eq(schema.medicines.id, req.params.id));
    if (medicine.length === 0) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.json(medicine[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const newMedicine = await db
      .insert(schema.medicines)
      .values(req.body)
      .returning();
    res.status(201).json(newMedicine[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const updatedMedicine = await db
      .update(schema.medicines)
      .set(req.body)
      .where(eq(schema.medicines.id, req.params.id))
      .returning();
    if (updatedMedicine.length === 0) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.json(updatedMedicine[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const deletedMedicine = await db
      .delete(schema.medicines)
      .where(eq(schema.medicines.id, req.params.id))
      .returning();
    if (deletedMedicine.length === 0) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
