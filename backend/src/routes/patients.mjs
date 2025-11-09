import { Router } from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientAdherenceLogs,
  addAdherenceLog,
} from "../controllers/patients.mjs";

const router = Router();

router.get("/", getAllPatients);
router.get("/:id", getPatientById);
router.post("/", createPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

router.get("/:id/adherence-logs", getPatientAdherenceLogs);
router.post("/:id/adherence-logs", addAdherenceLog);

export default router;
