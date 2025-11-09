import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await db.select().from(schema.doctors);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await db
      .select()
      .from(schema.doctors)
      .where(eq(schema.doctors.id, req.params.id));
    if (doctor.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const newDoctor = await db
      .insert(schema.doctors)
      .values(req.body)
      .returning();
    res.status(201).json(newDoctor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const updatedDoctor = await db
      .update(schema.doctors)
      .set(req.body)
      .where(eq(schema.doctors.id, req.params.id))
      .returning();
    if (updatedDoctor.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(updatedDoctor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const deletedDoctor = await db
      .delete(schema.doctors)
      .where(eq(schema.doctors.id, req.params.id))
      .returning();
    if (deletedDoctor.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
