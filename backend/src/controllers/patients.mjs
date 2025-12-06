import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";

export const getAllPatients = async (req, res) => {
  try {
    const patients = await db.select().from(schema.patients);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await db
      .select()
      .from(schema.patients)
      .where(eq(schema.patients.id, req.params.id));
    if (patient.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    const { userId, contactNumber, address, ...otherData } = req.body;

    // Basic validation
    if (!userId) {
      return res.status(400).json({ error: "Missing required field: userId" });
    }
    if (typeof userId !== 'string' || userId.length !== 36) {
        return res.status(400).json({ error: "Invalid userId format" });
    }
    if (contactNumber && typeof contactNumber !== 'string') {
        return res.status(400).json({ error: "Contact number must be a string" });
    }
    if (address && typeof address !== 'string') {
        return res.status(400).json({ error: "Address must be a string" });
    }

    const newPatient = await db
      .insert(schema.patients)
      .values({ userId, contactNumber, address, ...otherData })
      .returning();
    res.status(201).json(newPatient[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { userId, contactNumber, address, ...otherData } = req.body;
    const updateFields = { ...otherData };

    if (userId) {
        if (typeof userId !== 'string' || userId.length !== 36) {
            return res.status(400).json({ error: "Invalid userId format" });
        }
        updateFields.userId = userId;
    }
    if (contactNumber) {
        if (typeof contactNumber !== 'string') {
            return res.status(400).json({ error: "Contact number must be a string" });
        }
        updateFields.contactNumber = contactNumber;
    }
    if (address) {
        if (typeof address !== 'string') {
            return res.status(400).json({ error: "Address must be a string" });
        }
        updateFields.address = address;
    }

    const updatedPatient = await db
      .update(schema.patients)
      .set(updateFields)
      .where(eq(schema.patients.id, req.params.id))
      .returning();
    if (updatedPatient.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(updatedPatient[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const deletedPatient = await db
      .delete(schema.patients)
      .where(eq(schema.patients.id, req.params.id))
      .returning();
    if (deletedPatient.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientAdherenceLogs = async (req, res) => {
  try {
    const adherenceLogs = await db
      .select()
      .from(schema.adherenceLogs)
      .where(eq(schema.adherenceLogs.patientId, req.params.id));
    res.json(adherenceLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addAdherenceLog = async (req, res) => {
  try {
    const { medicineId, takenAt, missed, remarks, quantityTaken } = req.body;

    // Basic validation
    if (!medicineId || takenAt === undefined || missed === undefined) {
      return res.status(400).json({ error: "Missing required fields: medicineId, takenAt, missed" });
    }
    if (typeof medicineId !== 'string' || medicineId.length !== 36) {
        return res.status(400).json({ error: "Invalid medicineId format" });
    }
    if (isNaN(new Date(takenAt).getTime())) {
        return res.status(400).json({ error: "Invalid takenAt date format" });
    }
    if (typeof missed !== 'boolean') {
        return res.status(400).json({ error: "Missed must be a boolean" });
    }
    if (remarks && typeof remarks !== 'string') {
        return res.status(400).json({ error: "Remarks must be a string" });
    }
    if (quantityTaken && typeof quantityTaken !== 'number') {
        return res.status(400).json({ error: "Quantity taken must be a number" });
    }

    const newAdherenceLog = await db
      .insert(schema.adherenceLogs)
      .values({ patientId: req.params.id, medicineId, takenAt: new Date(takenAt), missed, remarks, quantityTaken })
      .returning();
    res.status(201).json(newAdherenceLog[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


