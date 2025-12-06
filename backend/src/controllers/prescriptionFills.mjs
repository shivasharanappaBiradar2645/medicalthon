import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq, and, sql } from "drizzle-orm";

export const getAllPrescriptionFills = async (req, res) => {
  try {
    const prescriptionFills = await db.select().from(schema.prescriptionFills);
    res.json(prescriptionFills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPrescriptionFillById = async (req, res) => {
  try {
    const prescriptionFill = await db
      .select()
      .from(schema.prescriptionFills)
      .where(eq(schema.prescriptionFills.id, req.params.id));
    if (prescriptionFill.length === 0) {
      return res.status(404).json({ message: "Prescription fill not found" });
    }
    res.json(prescriptionFill[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPrescriptionFill = async (req, res) => {
  try {
    const { pharmacyId, prescriptionMedicineId, quantityDispensed } = req.body;

    // Basic validation
    if (!pharmacyId || !prescriptionMedicineId || quantityDispensed === undefined) {
      return res.status(400).json({ error: "Missing required fields: pharmacyId, prescriptionMedicineId, quantityDispensed" });
    }
    if (typeof pharmacyId !== 'string' || pharmacyId.length !== 36) {
        return res.status(400).json({ error: "Invalid pharmacyId format" });
    }
    if (typeof prescriptionMedicineId !== 'string' || prescriptionMedicineId.length !== 36) {
        return res.status(400).json({ error: "Invalid prescriptionMedicineId format" });
    }
    if (typeof quantityDispensed !== 'number' || quantityDispensed <= 0) {
        return res.status(400).json({ error: "Quantity dispensed must be a positive number" });
    }

    const result = await db.transaction(async (tx) => {
      const prescriptionMedicine = await tx.query.prescriptionMedicines.findFirst({
        where: eq(schema.prescriptionMedicines.id, prescriptionMedicineId),
        with: {
          prescription: true,
          medicine: true,
        },
      });

      if (!prescriptionMedicine) {
        tx.rollback();
        return { error: "Prescription medicine not found", status: 404 };
      }

      if (prescriptionMedicine.prescription.status !== "ACTIVE") {
        tx.rollback();
        return { error: "Prescription is not active", status: 400 };
      }

      if (quantityDispensed > prescriptionMedicine.quantityPrescribed) {
        tx.rollback();
        return { error: "Quantity dispensed exceeds prescribed quantity", status: 400 };
      }

      const inventoryItem = await tx.query.inventory.findFirst({
        where: and(
          eq(schema.inventory.pharmacyId, pharmacyId),
          eq(schema.inventory.medicineId, prescriptionMedicine.medicineId)
        ),
      });

      if (!inventoryItem || inventoryItem.quantity < quantityDispensed) {
        tx.rollback();
        return { error: "Insufficient stock in pharmacy inventory", status: 400 };
      }

      await tx
        .update(schema.inventory)
        .set({ quantity: inventoryItem.quantity - quantityDispensed, lastUpdated: new Date() })
        .where(eq(schema.inventory.id, inventoryItem.id));

      const [prescriptionFill] = await tx
        .insert(schema.prescriptionFills)
        .values({
          pharmacyId,
          prescriptionMedicineId,
          quantityDispensed,
        })
        .returning();

      return { data: prescriptionFill };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(201).json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
