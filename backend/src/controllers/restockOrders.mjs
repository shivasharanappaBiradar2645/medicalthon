import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq, and } from "drizzle-orm";

export const getAllRestockOrders = async (req, res) => {
  try {
    const restockOrders = await db.select().from(schema.restockOrders);
    res.json(restockOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRestockOrderById = async (req, res) => {
  try {
    const restockOrder = await db
      .select()
      .from(schema.restockOrders)
      .where(eq(schema.restockOrders.id, req.params.id));
    if (restockOrder.length === 0) {
      return res.status(404).json({ message: "Restock order not found" });
    }
    res.json(restockOrder[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRestockOrder = async (req, res) => {
  try {
    const newRestockOrder = await db
      .insert(schema.restockOrders)
      .values(req.body)
      .returning();
    res.status(201).json(newRestockOrder[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRestockOrder = async (req, res) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Get the current restock order
      const currentOrderResult = await tx
        .select()
        .from(schema.restockOrders)
        .where(eq(schema.restockOrders.id, req.params.id));

      if (currentOrderResult.length === 0) {
        tx.rollback();
        return { error: "Restock order not found", status: 404 };
      }

      const currentOrder = currentOrderResult[0];

      // Update the restock order
      const [updatedRestockOrder] = await tx
        .update(schema.restockOrders)
        .set(req.body)
        .where(eq(schema.restockOrders.id, req.params.id))
        .returning();

      // If status is being changed to COMPLETED, update inventory
      if (req.body.status === "COMPLETED" && currentOrder.status !== "COMPLETED") {
        // Check if inventory item exists
        const existingInventory = await tx
          .select()
          .from(schema.inventory)
          .where(
            and(
              eq(schema.inventory.pharmacyId, currentOrder.pharmacyId),
              eq(schema.inventory.medicineId, currentOrder.medicineId)
            )
          );

        if (existingInventory.length > 0) {
          // Update existing inventory by adding the ordered quantity
          await tx
            .update(schema.inventory)
            .set({
              quantity: existingInventory[0].quantity + currentOrder.quantityOrdered,
              lastUpdated: new Date(),
            })
            .where(eq(schema.inventory.id, existingInventory[0].id));
        } else {
          // Create new inventory entry
          await tx
            .insert(schema.inventory)
            .values({
              pharmacyId: currentOrder.pharmacyId,
              medicineId: currentOrder.medicineId,
              batchNumber: `BATCH-${Date.now()}`,
              quantity: currentOrder.quantityOrdered,
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now as default
              lowStockThreshold: 10,
            });
        }
      }

      return { data: updatedRestockOrder };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRestockOrder = async (req, res) => {
  try {
    const deletedRestockOrder = await db
      .delete(schema.restockOrders)
      .where(eq(schema.restockOrders.id, req.params.id))
      .returning();
    if (deletedRestockOrder.length === 0) {
      return res.status(404).json({ message: "Restock order not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
