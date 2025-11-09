import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await db.select().from(schema.transactions);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const transaction = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, req.params.id));
    if (transaction.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const newTransaction = await db
      .insert(schema.transactions)
      .values(req.body)
      .returning();
    res.status(201).json(newTransaction[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
