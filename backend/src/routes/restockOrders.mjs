import { Router } from "express";
import {
  getAllRestockOrders,
  getRestockOrderById,
  createRestockOrder,
  updateRestockOrder,
  deleteRestockOrder,
} from "../controllers/restockOrders.mjs";

const router = Router();

router.get("/", getAllRestockOrders);
router.get("/:id", getRestockOrderById);
router.post("/", createRestockOrder);
router.put("/:id", updateRestockOrder);
router.delete("/:id", deleteRestockOrder);

export default router;
