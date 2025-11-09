import { Router } from "express";
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  addMedicineToPrescription,
  removeMedicineFromPrescription,
} from "../controllers/prescriptions.mjs";

const router = Router();

router.get("/", getAllPrescriptions);
router.get("/:id", getPrescriptionById);
router.post("/", createPrescription);
router.put("/:id", updatePrescription);
router.delete("/:id", deletePrescription);

router.post("/:id/medicines", addMedicineToPrescription);
router.delete("/:id/medicines/:medicineId", removeMedicineFromPrescription);

export default router;
