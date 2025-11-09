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
    const newPatient = await db
      .insert(schema.patients)
      .values(req.body)
      .returning();
    res.status(201).json(newPatient[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const updatedPatient = await db
      .update(schema.patients)
      .set(req.body)
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
    const newAdherenceLog = await db
      .insert(schema.adherenceLogs)
      .values({ ...req.body, patientId: req.params.id })
      .returning();
    res.status(201).json(newAdherenceLog[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
