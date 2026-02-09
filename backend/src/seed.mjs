import { db } from './models/db.mjs';
import * as schema from './models/schema.mjs';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Seeding database...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(schema.inventory);
    await db.delete(schema.prescriptionFills);
    await db.delete(schema.prescriptionMedicines);
    await db.delete(schema.prescriptions);
    await db.delete(schema.restockOrders);
    await db.delete(schema.notifications);
    await db.delete(schema.medicines);
    await db.delete(schema.doctors);
    await db.delete(schema.patients);
    await db.delete(schema.pharmacies);
    await db.delete(schema.distributors);
    await db.delete(schema.users);

    // --- Create Users ---
    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const usersToInsert = [
      { name: 'Dr. Alice', email: 'alice@medical.com', password: await bcrypt.hash('password123', salt), role: 'DOCTOR' },
      { name: 'Bob Pharmacist', email: 'bob@pharmacy.com', password: await bcrypt.hash('password123', salt), role: 'PHARMACIST' },
      { name: 'Charlie Patient', email: 'charlie@patient.com', password: await bcrypt.hash('password123', salt), role: 'PATIENT' },
      { name: 'Diana Distributor', email: 'diana@distro.com', password: await bcrypt.hash('password123', salt), role: 'DISTRIBUTOR' },
      { name: 'Eve Admin', email: 'eve@admin.com', password: await bcrypt.hash('password123', salt), role: 'ADMIN' },
    ];
    const [drAlice, bobPharmacist, charliePatient, dianaDistributor, eveAdmin] = await db.insert(schema.users).values(usersToInsert).returning();

    
    console.log('Creating profiles...');
    const [doctor] = await db.insert(schema.doctors).values({ userId: drAlice.id, specialization: 'Palliative Care' }).returning();
    const [patient] = await db.insert(schema.patients).values({ userId: charliePatient.id, contactNumber: '123-456-7890', address: '123 Main St' }).returning();
    const [pharmacy] = await db.insert(schema.pharmacies).values({ name: 'City Pharmacy', location: 'Downtown', contact: '987-654-3210', userId: bobPharmacist.id }).returning();
    const [distributor] = await db.insert(schema.distributors).values({ name: 'Medi-Supply Inc.', contactNumber: '555-555-5555', email: 'contact@medisupply.com', userId: dianaDistributor.id }).returning();

    // --- Create Medicines ---
    console.log('Creating medicines...');
    const medicinesToInsert = [
      { name: 'Morphine', manufacturer: 'Pharma Inc.', type: 'OPIOID', dosage: '10mg' },
      { name: 'Fentanyl', manufacturer: 'Pharma Inc.', type: 'OPIOID', dosage: '50mcg' },
      { name: 'Ibuprofen', manufacturer: 'Generic Co.', type: 'GENERAL', dosage: '200mg' },
    ];
    const [morphine, fentanyl, ibuprofen] = await db.insert(schema.medicines).values(medicinesToInsert).returning();

    // --- Create Inventory ---
    console.log('Creating inventory...');
    const inventoryToInsert = [
      { pharmacyId: pharmacy.id, medicineId: morphine.id, batchNumber: 'M123', quantity: 50, expiryDate: new Date('2026-12-31'), lowStockThreshold: 10 },
      { pharmacyId: pharmacy.id, medicineId: fentanyl.id, batchNumber: 'F456', quantity: 20, expiryDate: new Date('2027-06-30'), lowStockThreshold: 5 },
      { pharmacyId: pharmacy.id, medicineId: ibuprofen.id, batchNumber: 'I789', quantity: 200, expiryDate: new Date('2025-01-31'), lowStockThreshold: 50 },
    ];
    await db.insert(schema.inventory).values(inventoryToInsert);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seed();
