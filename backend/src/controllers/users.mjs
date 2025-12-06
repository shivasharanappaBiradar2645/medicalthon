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
    const { name, email, password, role, ...userData } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields: name, email, password, role" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    // Validate role against the enum values
    const validRoles = schema.userRole.enumValues;
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db
      .insert(schema.users)
      .values({ name, email, password: hashedPassword, role, ...userData })
      .returning();
    res.status(201).json(newUser[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { password, email, role, ...userData } = req.body;
    const updateFields = { ...userData };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      updateFields.email = email;
    }
    if (role) {
      const validRoles = schema.userRole.enumValues;
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
      }
      updateFields.role = role;
    }

    const updatedUser = await db
      .update(schema.users)
      .set(updateFields)
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
