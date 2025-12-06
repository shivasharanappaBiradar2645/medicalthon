import { Router } from "express";
import { getAllAdherenceLogs } from "../controllers/adherenceLogs.mjs";

const router = Router();

router.get("/", getAllAdherenceLogs);

export default router;
