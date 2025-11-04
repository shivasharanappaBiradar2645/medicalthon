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
export const userRole = pgEnum("Role", ["ADMIN", "DOCTOR", "PHARMACIST", "PATIENT"]);

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
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
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

export const medicines = pgTable("medicines", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }),
  type: medicineType("type").default("GENERAL").notNull(),
  dosage: varchar("dosage", { length: 50 }),
  expiryDate: timestamp("expiry_date"),
});

// -----------------------------
// RELATIONAL / LINKED TABLES
// -----------------------------

export const inventories = pgTable("inventories", {
  id: uuid("id").defaultRandom().primaryKey(),
  pharmacyId: uuid("pharmacy_id").notNull().references(() => pharmacies.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  threshold: integer("threshold").default(10),
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
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  pharmacyId: uuid("pharmacy_id").notNull().references(() => pharmacies.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  quantityDispensed: integer("quantity_dispensed").notNull(),
  dispensedAt: timestamp("dispensed_at").defaultNow(),
});

export const adherenceLogs = pgTable("adherence_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),
  takenAt: timestamp("taken_at").defaultNow(),
  missed: boolean("missed").default(false),
  remarks: text("remarks"),
});

// -----------------------------
// RELATIONS (Optional, for Drizzle ORM typing)
// -----------------------------

export const usersRelations = relations(users, ({ one }) => ({
  doctor: one(doctors, { fields: [users.id], references: [doctors.userId] }),
  patient: one(patients, { fields: [users.id], references: [patients.userId] }),
  pharmacy: one(pharmacies, { fields: [users.id], references: [pharmacies.userId] }),
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
  inventory: many(inventories),
  transactions: many(transactions),
}));

export const medicinesRelations = relations(medicines, ({ many }) => ({
  inventories: many(inventories),
  prescriptions: many(prescriptionMedicines),
  transactions: many(transactions),
  adherenceLogs: many(adherenceLogs),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  doctor: one(doctors, { fields: [prescriptions.doctorId], references: [doctors.id] }),
  patient: one(patients, { fields: [prescriptions.patientId], references: [patients.id] }),
  medicines: many(prescriptionMedicines),
  transactions: many(transactions),
}));
