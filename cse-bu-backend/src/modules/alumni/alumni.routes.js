import { Router } from "express";
import { Alumni } from "./alumni.model.js";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";

const router = Router();

// Public: list/one
router.get("/", async (req, res) => {
  const q = {};
  if (req.query.featured) q.featured = req.query.featured === "true";
  if (req.query.visible !== undefined) q.visible = req.query.visible === "true";
  const items = await Alumni.find(q).sort({ createdAt: -1 });
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const item = await Alumni.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

// Admin: create/update/delete
router.post("/", requireAuth, allow("admin"), async (req, res) => {
  const item = await Alumni.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", requireAuth, allow("admin"), async (req, res) => {
  const item = await Alumni.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

router.delete("/:id", requireAuth, allow("admin"), async (req, res) => {
  const item = await Alumni.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

export default router;
