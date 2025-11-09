import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq, and } from "drizzle-orm";

export const getAllPharmacies = async (req, res) => {
  try {
    const pharmacies = await db.select().from(schema.pharmacies);
    res.json(pharmacies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await db
      .select()
      .from(schema.pharmacies)
      .where(eq(schema.pharmacies.id, req.params.id));
    if (pharmacy.length === 0) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }
    res.json(pharmacy[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPharmacy = async (req, res) => {
  try {
    const newPharmacy = await db
      .insert(schema.pharmacies)
      .values(req.body)
      .returning();
    res.status(201).json(newPharmacy[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePharmacy = async (req, res) => {
  try {
    const updatedPharmacy = await db
      .update(schema.pharmacies)
      .set(req.body)
      .where(eq(schema.pharmacies.id, req.params.id))
      .returning();
    if (updatedPharmacy.length === 0) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }
    res.json(updatedPharmacy[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePharmacy = async (req, res) => {
  try {
    const deletedPharmacy = await db
      .delete(schema.pharmacies)
      .where(eq(schema.pharmacies.id, req.params.id))
      .returning();
    if (deletedPharmacy.length === 0) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPharmacyInventory = async (req, res) => {
  try {
    const inventory = await db
      .select()
      .from(schema.inventories)
      .where(eq(schema.inventories.pharmacyId, req.params.id));
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addMedicineToInventory = async (req, res) => {
  try {
    const newInventoryItem = await db
      .insert(schema.inventories)
      .values({ ...req.body, pharmacyId: req.params.id })
      .returning();
    res.status(201).json(newInventoryItem[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const updatedInventoryItem = await db
      .update(schema.inventories)
      .set(req.body)
      .where(
        and(
          eq(schema.inventories.pharmacyId, req.params.id),
          eq(schema.inventories.medicineId, req.params.medicineId)
        )
      )
      .returning();
    if (updatedInventoryItem.length === 0) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json(updatedInventoryItem[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
