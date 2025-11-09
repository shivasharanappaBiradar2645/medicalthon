import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq, and } from "drizzle-orm";

export const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await db.select().from(schema.prescriptions);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await db
      .select()
      .from(schema.prescriptions)
      .where(eq(schema.prescriptions.id, req.params.id));
    if (prescription.length === 0) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.json(prescription[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const newPrescription = await db
      .insert(schema.prescriptions)
      .values(req.body)
      .returning();
    res.status(201).json(newPrescription[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const updatedPrescription = await db
      .update(schema.prescriptions)
      .set(req.body)
      .where(eq(schema.prescriptions.id, req.params.id))
      .returning();
    if (updatedPrescription.length === 0) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.json(updatedPrescription[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePrescription = async (req, res) => {
  try {
    const deletedPrescription = await db
      .delete(schema.prescriptions)
      .where(eq(schema.prescriptions.id, req.params.id))
      .returning();
    if (deletedPrescription.length === 0) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addMedicineToPrescription = async (req, res) => {
  try {
    const newMedicine = await db
      .insert(schema.prescriptionMedicines)
      .values({ ...req.body, prescriptionId: req.params.id })
      .returning();
    res.status(201).json(newMedicine[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMedicineFromPrescription = async (req, res) => {
  try {
    const deletedMedicine = await db
      .delete(schema.prescriptionMedicines)
      .where(
        and(
          eq(schema.prescriptionMedicines.prescriptionId, req.params.id),
          eq(schema.prescriptionMedicines.medicineId, req.params.medicineId)
        )
      )
      .returning();
    if (deletedMedicine.length === 0) {
      return res.status(404).json({ message: "Medicine not found in prescription" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
