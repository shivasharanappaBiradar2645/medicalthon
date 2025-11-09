import { Router } from "express";
import {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from "../controllers/medicines.mjs";

const router = Router();

router.get("/", getAllMedicines);
router.get("/:id", getMedicineById);
router.post("/", createMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

export default router;
