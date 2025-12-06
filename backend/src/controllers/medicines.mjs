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
    const { name, manufacturer, type, dosage, ...otherData } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ error: "Missing required field: name" });
    }
    if (typeof name !== 'string') {
        return res.status(400).json({ error: "Name must be a string" });
    }
    if (manufacturer && typeof manufacturer !== 'string') {
        return res.status(400).json({ error: "Manufacturer must be a string" });
    }
    if (type) {
      const validTypes = schema.medicineType.enumValues;
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid medicine type. Must be one of: ${validTypes.join(", ")}` });
      }
    }
    if (dosage && typeof dosage !== 'string') {
        return res.status(400).json({ error: "Dosage must be a string" });
    }

    const newMedicine = await db
      .insert(schema.medicines)
      .values({ name, manufacturer, type, dosage, ...otherData })
      .returning();
    res.status(201).json(newMedicine[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const { name, manufacturer, type, dosage, ...otherData } = req.body;
    const updateFields = { ...otherData };

    if (name) {
        if (typeof name !== 'string') {
            return res.status(400).json({ error: "Name must be a string" });
        }
        updateFields.name = name;
    }
    if (manufacturer) {
        if (typeof manufacturer !== 'string') {
            return res.status(400).json({ error: "Manufacturer must be a string" });
        }
        updateFields.manufacturer = manufacturer;
    }
    if (type) {
      const validTypes = schema.medicineType.enumValues;
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid medicine type. Must be one of: ${validTypes.join(", ")}` });
      }
      updateFields.type = type;
    }
    if (dosage) {
        if (typeof dosage !== 'string') {
            return res.status(400).json({ error: "Dosage must be a string" });
        }
        updateFields.dosage = dosage;
    }

    const updatedMedicine = await db
      .update(schema.medicines)
      .set(updateFields)
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
