import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";

export const getAllDistributors = async (req, res) => {
  try {
    const distributors = await db.select().from(schema.distributors);
    res.json(distributors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDistributorById = async (req, res) => {
  try {
    const distributor = await db
      .select()
      .from(schema.distributors)
      .where(eq(schema.distributors.id, req.params.id));
    if (distributor.length === 0) {
      return res.status(404).json({ message: "Distributor not found" });
    }
    res.json(distributor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createDistributor = async (req, res) => {
  try {
    const { name, contactNumber, email, userId, ...otherData } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ error: "Missing required fields: name, email" });
    }
    if (typeof name !== 'string') {
        return res.status(400).json({ error: "Name must be a string" });
    }
    if (contactNumber && typeof contactNumber !== 'string') {
        return res.status(400).json({ error: "Contact number must be a string" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (userId && (typeof userId !== 'string' || userId.length !== 36)) {
        return res.status(400).json({ error: "Invalid userId format" });
    }

    const newDistributor = await db
      .insert(schema.distributors)
      .values({ name, contactNumber, email, userId, ...otherData })
      .returning();
    res.status(201).json(newDistributor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDistributor = async (req, res) => {
  try {
    const { name, contactNumber, email, userId, ...otherData } = req.body;
    const updateFields = { ...otherData };

    if (name) {
        if (typeof name !== 'string') {
            return res.status(400).json({ error: "Name must be a string" });
        }
        updateFields.name = name;
    }
    if (contactNumber) {
        if (typeof contactNumber !== 'string') {
            return res.status(400).json({ error: "Contact number must be a string" });
        }
        updateFields.contactNumber = contactNumber;
    }
    if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        updateFields.email = email;
    }
    if (userId) {
        if (typeof userId !== 'string' || userId.length !== 36) {
            return res.status(400).json({ error: "Invalid userId format" });
        }
        updateFields.userId = userId;
    }

    const updatedDistributor = await db
      .update(schema.distributors)
      .set(updateFields)
      .where(eq(schema.distributors.id, req.params.id))
      .returning();
    if (updatedDistributor.length === 0) {
      return res.status(404).json({ message: "Distributor not found" });
    }
    res.json(updatedDistributor[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDistributor = async (req, res) => {
  try {
    const deletedDistributor = await db
      .delete(schema.distributors)
      .where(eq(schema.distributors.id, req.params.id))
      .returning();
    if (deletedDistributor.length === 0) {
      return res.status(404).json({ message: "Distributor not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
