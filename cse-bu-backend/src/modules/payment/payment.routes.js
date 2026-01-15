import { Router } from "express";
import {
  createSession, sslSuccess, sslFail, sslCancel, sslIpn, getMine, getByTranId
} from "./payment.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// Create an SSLCommerz session
router.post("/session", requireAuth, createSession);

// SSLCommerz callbacks (must be PUBLIC and POST)
router.post("/ssl/success", sslSuccess);
router.post("/ssl/fail",    sslFail);
router.post("/ssl/cancel",  sslCancel);
router.post("/ssl/ipn",     sslIpn);

// Queries
router.get("/me", requireAuth, getMine);
router.get("/:tranId", requireAuth, getByTranId);

export default router;
