import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq, and, sql } from "drizzle-orm";

export const getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await db.query.prescriptions.findMany({
      with: {
        prescriptionMedicines: true,
      },
    });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await db.query.prescriptions.findFirst({
      where: eq(schema.prescriptions.id, req.params.id),
      with: {
        prescriptionMedicines: true,
      },
    });
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { doctorId, patientId, status, notes, medicines } = req.body;

    // Validate prescription details
    if (!doctorId || !patientId) {
      return res.status(400).json({ error: "Missing required fields: doctorId, patientId" });
    }
    if (typeof doctorId !== 'string' || doctorId.length !== 36) {
        return res.status(400).json({ error: "Invalid doctorId format" });
    }
    if (typeof patientId !== 'string' || patientId.length !== 36) {
        return res.status(400).json({ error: "Invalid patientId format" });
    }
    if (status) {
      const validStatuses = schema.prescriptionStatus.enumValues;
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid prescription status. Must be one of: ${validStatuses.join(", ")}` });
      }
    }
    if (notes && typeof notes !== 'string') {
        return res.status(400).json({ error: "Notes must be a string" });
    }

    // Validate medicines array
    if (medicines && medicines.length > 0) {
      for (const med of medicines) {
        const { medicineId, dosage, frequency, duration, quantityPrescribed } = med;
        if (!medicineId || !dosage || !frequency || !duration || quantityPrescribed === undefined) {
          return res.status(400).json({ error: "Missing required fields for medicine in prescription: medicineId, dosage, frequency, duration, quantityPrescribed" });
        }
        if (typeof medicineId !== 'string' || medicineId.length !== 36) {
            return res.status(400).json({ error: "Invalid medicineId format in prescription" });
        }
        if (typeof dosage !== 'string') {
            return res.status(400).json({ error: "Dosage must be a string in prescription" });
        }
        if (typeof frequency !== 'string') {
            return res.status(400).json({ error: "Frequency must be a string in prescription" });
        }
        if (typeof duration !== 'number' || duration <= 0) {
            return res.status(400).json({ error: "Duration must be a positive number in prescription" });
        }
        if (typeof quantityPrescribed !== 'number' || quantityPrescribed <= 0) {
            return res.status(400).json({ error: "Quantity prescribed must be a positive number in prescription" });
        }
      }
    }

    const result = await db.transaction(async (tx) => {
      const [prescription] = await tx
        .insert(schema.prescriptions)
        .values({ doctorId, patientId, status, notes })
        .returning();

      if (!prescription) {
        tx.rollback();
        return { error: "Failed to create prescription", status: 400 };
      }

      if (medicines && medicines.length > 0) {
        const prescriptionMedicinesToInsert = medicines.map((med) => ({
          ...med,
          prescriptionId: prescription.id,
        }));
        const insertedMedicines = await tx.insert(schema.prescriptionMedicines).values(prescriptionMedicinesToInsert).returning();
        prescription.prescriptionMedicines = insertedMedicines;
      }
      return { data: prescription };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(201).json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const { doctorId, patientId, status, notes, ...otherData } = req.body;
    const updateFields = { ...otherData };

    if (doctorId) {
        if (typeof doctorId !== 'string' || doctorId.length !== 36) {
            return res.status(400).json({ error: "Invalid doctorId format" });
        }
        updateFields.doctorId = doctorId;
    }
    if (patientId) {
        if (typeof patientId !== 'string' || patientId.length !== 36) {
            return res.status(400).json({ error: "Invalid patientId format" });
        }
        updateFields.patientId = patientId;
    }
    if (status) {
      const validStatuses = schema.prescriptionStatus.enumValues;
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid prescription status. Must be one of: ${validStatuses.join(", ")}` });
      }
      updateFields.status = status;
    }
    if (notes) {
        if (typeof notes !== 'string') {
            return res.status(400).json({ error: "Notes must be a string" });
        }
        updateFields.notes = notes;
    }

    const updatedPrescription = await db
      .update(schema.prescriptions)
      .set(updateFields)
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
    const { medicineId, dosage, frequency, duration, quantityPrescribed } = req.body;

    // Basic validation
    if (!medicineId || !dosage || !frequency || !duration || quantityPrescribed === undefined) {
      return res.status(400).json({ error: "Missing required fields: medicineId, dosage, frequency, duration, quantityPrescribed" });
    }
    if (typeof medicineId !== 'string' || medicineId.length !== 36) {
        return res.status(400).json({ error: "Invalid medicineId format" });
    }
    if (typeof dosage !== 'string') {
        return res.status(400).json({ error: "Dosage must be a string" });
    }
    if (typeof frequency !== 'string') {
        return res.status(400).json({ error: "Frequency must be a string" });
    }
    if (typeof duration !== 'number' || duration <= 0) {
        return res.status(400).json({ error: "Duration must be a positive number" });
    }
    if (typeof quantityPrescribed !== 'number' || quantityPrescribed <= 0) {
        return res.status(400).json({ error: "Quantity prescribed must be a positive number" });
    }

    const [newMedicine] = await db
      .insert(schema.prescriptionMedicines)
      .values({
        prescriptionId: req.params.id,
        medicineId,
        dosage,
        frequency,
        duration,
        quantityPrescribed,
      })
      .returning();
    res.status(201).json(newMedicine);
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
