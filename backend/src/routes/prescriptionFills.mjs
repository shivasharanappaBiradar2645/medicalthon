import { Router } from "express";
import {
  getAllPrescriptionFills,
  getPrescriptionFillById,
  createPrescriptionFill,
} from "../controllers/prescriptionFills.mjs";

const router = Router();

router.get("/", getAllPrescriptionFills);
router.get("/:id", getPrescriptionFillById);
router.post("/", createPrescriptionFill);

export default router;
