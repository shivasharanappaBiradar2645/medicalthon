import { db } from "../models/db.mjs";
import * as schema from "../models/schema.mjs";

export const getAllAdherenceLogs = async (req, res) => {
  try {
    const adherenceLogs = await db.query.adherenceLogs.findMany({
        with: {
            patient: {
                with: {
                    user: true
                }
            },
            medicine: true
        }
    });
    res.json(adherenceLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
