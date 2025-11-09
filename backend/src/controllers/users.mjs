import * as schema from "../models/schema.mjs";
import { db } from "../models/db.mjs";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const getAllUsers = async (req, res) => {
  try {
    const users = await db.select().from(schema.users);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.params.id));
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db
      .insert(schema.users)
      .values({ ...userData, password: hashedPassword })
      .returning();
    res.status(201).json(newUser[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      userData.password = hashedPassword;
    }

    const updatedUser = await db
      .update(schema.users)
      .set(userData)
      .where(eq(schema.users.id, req.params.id))
      .returning();
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await db
      .delete(schema.users)
      .where(eq(schema.users.id, req.params.id))
      .returning();
    if (deletedUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
