import { Router } from "express";
import {
  getAllDistributors,
  getDistributorById,
  createDistributor,
  updateDistributor,
  deleteDistributor,
} from "../controllers/distributors.mjs";

const router = Router();

router.get("/", getAllDistributors);
router.get("/:id", getDistributorById);
router.post("/", createDistributor);
router.put("/:id", updateDistributor);
router.delete("/:id", deleteDistributor);

export default router;
