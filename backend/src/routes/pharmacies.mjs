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
  deleteInventory,
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
router.delete("/:id/inventory/:medicineId", deleteInventory);

export default router;
