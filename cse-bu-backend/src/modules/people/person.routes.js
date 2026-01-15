import { Router } from "express";
import { Person } from "./person.model.js";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";

const router = Router();

/** List people (optionally filter by category: faculty|staff) */
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const items = await Person.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { next(e); }
});

/** Create person (admin) */
router.post("/", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const { name, designation, category, email, phone, bio, photoUrl } = req.body;
    if (!name || !designation || !category) {
      return res.status(400).json({ message: "name, designation, category are required" });
    }
    const doc = await Person.create({
      name, designation, category, email, phone, bio, photoUrl: photoUrl || ""
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

/** Update person (admin) */
router.put("/:id", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const updated = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (e) { next(e); }
});

/** Delete person (admin) */
router.delete("/:id", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const deleted = await Person.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
