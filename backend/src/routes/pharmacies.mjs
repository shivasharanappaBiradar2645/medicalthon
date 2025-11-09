import { Router } from "express";
import {
  getAllPharmacies,
  getPharmacyById,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  getPharmacyInventory,
  addMedicineToInventory,
  updateInventory,
} from "../controllers/pharmacies.mjs";

const router = Router();

router.get("/", getAllPharmacies);
router.get("/:id", getPharmacyById);
router.post("/", createPharmacy);
router.put("/:id", updatePharmacy);
router.delete("/:id", deletePharmacy);

router.get("/:id/inventory", getPharmacyInventory);
router.post("/:id/inventory", addMedicineToInventory);
router.put("/:id/inventory/:medicineId", updateInventory);

export default router;
