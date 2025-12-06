import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -----------------------------
// ENUMS
// -----------------------------
export const medicineType = pgEnum("MedicineType", ["GENERAL", "OPIOID", "CONTROLLED"]);
export const prescriptionStatus = pgEnum("PrescriptionStatus", ["ACTIVE", "COMPLETED", "CANCELLED"]);
export const userRole = pgEnum("Role", ["ADMIN", "DOCTOR", "PHARMACIST", "PATIENT", "DISTRIBUTOR"]);
export const restockOrderStatus = pgEnum("RestockOrderStatus", ["PENDING", "SHIPPED", "COMPLETED", "CANCELLED"]);
export const notificationType = pgEnum("NotificationType", ["LOW_STOCK", "EXPIRY_WARNING", "ORDER_SHIPPED", "ORDER_COMPLETED"]);


// -----------------------------
// TABLES
// -----------------------------

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  role: userRole("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  specialization: varchar("specialization", { length: 100 }),
});

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique(),
  contactNumber: varchar("contact_number", { length: 20 }),
  address: text("address"),
});

export const pharmacies = pgTable("pharmacies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  location: text("location").notNull(),
  contact: varchar("contact", { length: 20 }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
});

export const distributors = pgTable("distributors", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    contactNumber: varchar("contact_number", { length: 20 }),
    email: varchar("email", { length: 100 }).notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
});

export const medicines = pgTable("medicines", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }),
  type: medicineType("type").default("GENERAL").notNull(),
  dosage: varchar("dosage", { length: 50 }),
});

export const inventory = pgTable("inventory", {
    id: uuid("id").defaultRandom().primaryKey(),
    pharmacyId: uuid("pharmacy_id").notNull().references(() => pharmacies.id, { onDelete: "cascade" }),
    medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
    batchNumber: varchar("batch_number", { length: 100 }).notNull(),
    quantity: integer("quantity").notNull(),
    expiryDate: timestamp("expiry_date").notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(10),
    lastUpdated: timestamp("last_updated").defaultNow(),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  status: prescriptionStatus("status").default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
});

export const prescriptionMedicines = pgTable("prescription_medicines", {
  id: uuid("id").defaultRandom().primaryKey(),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  dosage: varchar("dosage", { length: 50 }).notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(),
  duration: integer("duration").notNull(), // in days
  quantityPrescribed: integer("quantity_prescribed").notNull(),
});

export const prescriptionFills = pgTable("prescription_fills", {
  id: uuid("id").defaultRandom().primaryKey(),
  pharmacyId: uuid("pharmacy_id").notNull().references(() => pharmacies.id, { onDelete: "cascade" }),
  prescriptionMedicineId: uuid("prescription_medicine_id").notNull().references(() => prescriptionMedicines.id, { onDelete: "cascade" }),
  quantityDispensed: integer("quantity_dispensed").notNull(),
  dispensedAt: timestamp("dispensed_at").defaultNow(),
});

export const restockOrders = pgTable("restock_orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    pharmacyId: uuid("pharmacy_id").notNull().references(() => pharmacies.id, { onDelete: "cascade" }),
    distributorId: uuid("distributor_id").notNull().references(() => distributors.id, { onDelete: "cascade" }),
    medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
    quantityOrdered: integer("quantity_ordered").notNull(),
    status: restockOrderStatus("status").default("PENDING"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

export const adherenceLogs = pgTable("adherence_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  takenAt: timestamp("taken_at").defaultNow(),
  missed: boolean("missed").default(false),
  remarks: text("remarks"),
  quantityTaken: integer("quantity_taken"),
});


// -----------------------------
// RELATIONS
// -----------------------------

export const usersRelations = relations(users, ({ one }) => ({
  doctor: one(doctors, { fields: [users.id], references: [doctors.userId] }),
  patient: one(patients, { fields: [users.id], references: [patients.userId] }),
  pharmacy: one(pharmacies, { fields: [users.id], references: [pharmacies.userId] }),
  distributor: one(distributors, { fields: [users.id], references: [distributors.userId] }),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  prescriptions: many(prescriptions),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, { fields: [patients.userId], references: [users.id] }),
  prescriptions: many(prescriptions),
  adherenceLogs: many(adherenceLogs),
}));

export const pharmaciesRelations = relations(pharmacies, ({ one, many }) => ({
  user: one(users, { fields: [pharmacies.userId], references: [users.id] }),
  inventory: many(inventory),
  prescriptionFills: many(prescriptionFills),
  restockOrders: many(restockOrders),
}));

export const distributorsRelations = relations(distributors, ({ one, many }) => ({
    user: one(users, { fields: [distributors.userId], references: [users.id] }),
    restockOrders: many(restockOrders),
}));

export const medicinesRelations = relations(medicines, ({ many }) => ({
  inventory: many(inventory),
  prescriptionMedicines: many(prescriptionMedicines),
  restockOrders: many(restockOrders),
  adherenceLogs: many(adherenceLogs),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
    pharmacy: one(pharmacies, { fields: [inventory.pharmacyId], references: [pharmacies.id] }),
    medicine: one(medicines, { fields: [inventory.medicineId], references: [medicines.id] }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  doctor: one(doctors, { fields: [prescriptions.doctorId], references: [doctors.id] }),
  patient: one(patients, { fields: [prescriptions.patientId], references: [patients.id] }),
  prescriptionMedicines: many(prescriptionMedicines),
}));

export const prescriptionMedicinesRelations = relations(prescriptionMedicines, ({ one, many }) => ({
    prescription: one(prescriptions, { fields: [prescriptionMedicines.prescriptionId], references: [prescriptions.id] }),
    medicine: one(medicines, { fields: [prescriptionMedicines.medicineId], references: [medicines.id] }),
    prescriptionFills: many(prescriptionFills),
}));

export const prescriptionFillsRelations = relations(prescriptionFills, ({ one }) => ({
    pharmacy: one(pharmacies, { fields: [prescriptionFills.pharmacyId], references: [pharmacies.id] }),
    prescriptionMedicine: one(prescriptionMedicines, { fields: [prescriptionFills.prescriptionMedicineId], references: [prescriptionMedicines.id] }),
}));

export const restockOrdersRelations = relations(restockOrders, ({ one }) => ({
    pharmacy: one(pharmacies, { fields: [restockOrders.pharmacyId], references: [pharmacies.id] }),
    distributor: one(distributors, { fields: [restockOrders.distributorId], references: [distributors.id] }),
    medicine: one(medicines, { fields: [restockOrders.medicineId], references: [medicines.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const adherenceLogsRelations = relations(adherenceLogs, ({ one }) => ({
    patient: one(patients, { fields: [adherenceLogs.patientId], references: [patients.id] }),
    medicine: one(medicines, { fields: [adherenceLogs.medicineId], references: [medicines.id] }),
}));
