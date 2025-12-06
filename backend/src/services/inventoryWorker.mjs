import { db } from "../models/db.mjs";
import * as schema from "../models/schema.mjs";
import { eq, and, lt, lte, gt, sql } from "drizzle-orm";

const LOW_STOCK_THRESHOLD_DAYS = 7; // Days before expiry to trigger a warning

export const checkInventoryAndNotify = async () => {
  console.log("Running inventory check and notification worker...");
  try {
    // Check for low stock
    await checkLowStock();

    // Check for expiring medicines
    await checkExpiringMedicines();

    console.log("Inventory check and notification worker finished.");
  } catch (error) {
    console.error("Error in inventory worker:", error);
  }
};

const checkLowStock = async () => {
  const lowStockItems = await db.query.inventory.findMany({
    where: lte(schema.inventory.quantity, schema.inventory.lowStockThreshold),
    with: {
      pharmacy: true,
      medicine: true,
    },
  });

  for (const item of lowStockItems) {
    console.log(
      `Low stock alert: ${item.medicine.name} at ${item.pharmacy.name}. Current: ${item.quantity}, Threshold: ${item.lowStockThreshold}`
    );

    // Create a restock order if one doesn't exist or is not pending
    const existingOrder = await db.query.restockOrders.findFirst({
      where: and(
        eq(schema.restockOrders.pharmacyId, item.pharmacyId),
        eq(schema.restockOrders.medicineId, item.medicineId),
        eq(schema.restockOrders.status, "PENDING")
      ),
    });

    if (!existingOrder) {
      // For simplicity, let's assume a default distributor for now
      // In a real app, you'd have logic to select the best distributor
      const distributor = await db.query.distributors.findFirst();
      if (distributor) {
        await db.insert(schema.restockOrders).values({
          pharmacyId: item.pharmacyId,
          distributorId: distributor.id,
          medicineId: item.medicineId,
          quantityOrdered: item.lowStockThreshold * 2, // Order double the threshold
          status: "PENDING",
        });
        console.log(`Created restock order for ${item.medicine.name} at ${item.pharmacy.name}`);

        // Create notification for pharmacy user
        if (item.pharmacy.userId) {
          await db.insert(schema.notifications).values({
            userId: item.pharmacy.userId,
            type: "LOW_STOCK",
            message: `Low stock for ${item.medicine.name}. A restock order has been placed.`,
          });
        }
      } else {
        console.warn("No distributors found to place restock order.");
      }
    }
  }
};

const checkExpiringMedicines = async () => {
  const expiryDateThreshold = new Date();
  expiryDateThreshold.setDate(expiryDateThreshold.getDate() + LOW_STOCK_THRESHOLD_DAYS);

  const expiringItems = await db.query.inventory.findMany({
    where: and(
      lt(schema.inventory.expiryDate, expiryDateThreshold),
      gt(schema.inventory.quantity, 0) // Only notify if there's still stock
    ),
    with: {
      pharmacy: true,
      medicine: true,
    },
  });

  for (const item of expiringItems) {
    console.log(
      `Expiry alert: ${item.medicine.name} at ${item.pharmacy.name} expires on ${item.expiryDate.toDateString()}. Current: ${item.quantity}`
    );

    // Create notification for pharmacy user
    if (item.pharmacy.userId) {
      await db.insert(schema.notifications).values({
        userId: item.pharmacy.userId,
        type: "EXPIRY_WARNING",
        message: `Warning: ${item.medicine.name} (Batch: ${item.batchNumber}) at your pharmacy will expire on ${item.expiryDate.toDateString()}. Current stock: ${item.quantity}.`,
      });
    }
  }
};

// This function would be called periodically, e.g., every hour
// For a hackathon, you might trigger it manually or use a simple setInterval
// In a production environment, you'd use a proper job scheduler (e.g., cron, BullMQ)
export const startInventoryWorker = (interval = 60000) => { // Default to 1 minute for testing
    console.log(`Starting inventory worker to run every ${interval / 1000} seconds.`);
    checkInventoryAndNotify(); // Run once immediately
    setInterval(checkInventoryAndNotify, interval);
};
