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
    const { name, location, contact, userId, ...otherData } = req.body;

    // Basic validation
    if (!name || !location) {
      return res.status(400).json({ error: "Missing required fields: name, location" });
    }
    if (typeof name !== 'string' || typeof location !== 'string') {
        return res.status(400).json({ error: "Name and location must be strings" });
    }
    if (contact && typeof contact !== 'string') {
        return res.status(400).json({ error: "Contact must be a string" });
    }
    if (userId && (typeof userId !== 'string' || userId.length !== 36)) {
        return res.status(400).json({ error: "Invalid userId format" });
    }

    const newPharmacy = await db
      .insert(schema.pharmacies)
      .values({ name, location, contact, userId, ...otherData })
      .returning();
    res.status(201).json(newPharmacy[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePharmacy = async (req, res) => {
  try {
    const { name, location, contact, userId, ...otherData } = req.body;
    const updateFields = { ...otherData };

    if (name) {
        if (typeof name !== 'string') {
            return res.status(400).json({ error: "Name must be a string" });
        }
        updateFields.name = name;
    }
    if (location) {
        if (typeof location !== 'string') {
            return res.status(400).json({ error: "Location must be a string" });
        }
        updateFields.location = location;
    }
    if (contact) {
        if (typeof contact !== 'string') {
            return res.status(400).json({ error: "Contact must be a string" });
        }
        updateFields.contact = contact;
    }
    if (userId) {
        if (typeof userId !== 'string' || userId.length !== 36) {
            return res.status(400).json({ error: "Invalid userId format" });
        }
        updateFields.userId = userId;
    }

    const updatedPharmacy = await db
      .update(schema.pharmacies)
      .set(updateFields)
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

      .from(schema.inventory)

      .where(eq(schema.inventory.pharmacyId, req.params.id));

    res.json(inventory);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};



export const addMedicineToInventory = async (req, res) => {



  try {



    const { medicineId, batchNumber, quantity, expiryDate, lowStockThreshold } = req.body;







    // Basic validation



    if (!medicineId || !batchNumber || quantity === undefined || !expiryDate) {



      return res.status(400).json({ error: "Missing required fields: medicineId, batchNumber, quantity, expiryDate" });



    }



    if (typeof medicineId !== 'string' || medicineId.length !== 36) {



        return res.status(400).json({ error: "Invalid medicineId format" });



    }



    if (typeof batchNumber !== 'string') {



        return res.status(400).json({ error: "Batch number must be a string" });



    }



    if (typeof quantity !== 'number' || quantity < 0) {



        return res.status(400).json({ error: "Quantity must be a non-negative number" });



    }



    if (isNaN(new Date(expiryDate).getTime())) {



        return res.status(400).json({ error: "Invalid expiryDate date format" });



    }



    if (lowStockThreshold !== undefined && (typeof lowStockThreshold !== 'number' || lowStockThreshold < 0)) {



        return res.status(400).json({ error: "Low stock threshold must be a non-negative number" });



    }







    const newInventoryItem = await db



      .insert(schema.inventory)



      .values({



        pharmacyId: req.params.id,



        medicineId,



        batchNumber,



        quantity,



        expiryDate: new Date(expiryDate),



        lowStockThreshold,



      })



      .returning();



    res.status(201).json(newInventoryItem[0]);



  } catch (error) {



    res.status(500).json({ error: error.message });



  }



};



export const updateInventory = async (req, res) => {



  try {



    const { batchNumber, quantity, expiryDate, lowStockThreshold, ...otherData } = req.body;



    const updateFields = { ...otherData };







    if (batchNumber) {



        if (typeof batchNumber !== 'string') {



            return res.status(400).json({ error: "Batch number must be a string" });



        }



        updateFields.batchNumber = batchNumber;



    }



    if (quantity !== undefined) {



        if (typeof quantity !== 'number' || quantity < 0) {



            return res.status(400).json({ error: "Quantity must be a non-negative number" });



        }



        updateFields.quantity = quantity;



    }



    if (expiryDate) {



        if (isNaN(new Date(expiryDate).getTime())) {



            return res.status(400).json({ error: "Invalid expiryDate date format" });



        }



        updateFields.expiryDate = new Date(expiryDate);



    }



    if (lowStockThreshold !== undefined) {



        if (typeof lowStockThreshold !== 'number' || lowStockThreshold < 0) {



            return res.status(400).json({ error: "Low stock threshold must be a non-negative number" });



        }



        updateFields.lowStockThreshold = lowStockThreshold;



    }



    updateFields.lastUpdated = new Date(); // Update last updated timestamp







    const updatedInventoryItem = await db



      .update(schema.inventory)



      .set(updateFields)



      .where(



        and(



          eq(schema.inventory.pharmacyId, req.params.id),



          eq(schema.inventory.medicineId, req.params.medicineId)



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



export const deleteInventory = async (req, res) => {

  try {

    const deletedInventoryItem = await db

      .delete(schema.inventory)

      .where(

        and(

          eq(schema.inventory.pharmacyId, req.params.id),

          eq(schema.inventory.medicineId, req.params.medicineId)

        )

      )

      .returning();

    if (deletedInventoryItem.length === 0) {

      return res.status(404).json({ message: "Inventory item not found" });

    }

    res.status(204).send();

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};
