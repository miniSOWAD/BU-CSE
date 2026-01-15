import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";
import { AcademicDoc } from "./academics.model.js";

const router = Router();

// List (optionally by category)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const q = {};
    if (category && category !== "all") q.category = category;
    const items = await AcademicDoc.find(q).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error("GET /academics error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Create (admin only)
router.post("/", requireAuth, allow("admin"), async (req, res) => {
  try {
    const { title, category, description, year, file } = req.body;

    if (!title || !category || !file) {
      return res
        .status(400)
        .json({ message: "title, category and file are required" });
    }
    if (!["calendar", "routine", "form", "undergraduate", "graduate"].includes(category)) {
      return res.status(400).json({ message: "Invalid category value" });
    }
    if (file?.kind !== "pdf") {
      return res.status(400).json({ message: "file.kind must be 'pdf'" });
    }

    const doc = await AcademicDoc.create({
      title,
      category,
      description,
      year: year || undefined,
      file,
      createdBy: req.user.id,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("POST /academics error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// Update (admin only)
router.put("/:id", requireAuth, allow("admin"), async (req, res) => {
  try {
    const { title, category, description, year, file } = req.body;
    const doc = await AcademicDoc.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    if (title !== undefined) doc.title = title;
    if (category !== undefined) {
      if (!["calendar", "routine", "form", "undergraduate", "graduate"].includes(category)) {
        return res.status(400).json({ message: "Invalid category value" });
      }
      doc.category = category;
    }
    if (description !== undefined) doc.description = description;
    if (year !== undefined) doc.year = year;
    if (file !== undefined) {
      if (file && file.kind !== "pdf") {
        return res.status(400).json({ message: "file.kind must be 'pdf'" });
      }
      doc.file = file || doc.file;
    }

    const updated = await doc.save();
    res.json(updated);
  } catch (e) {
    console.error("PUT /academics/:id error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// Delete (admin only) — note: does not delete the Cloudinary asset
router.delete("/:id", requireAuth, allow("admin"), async (req, res) => {
  try {
    await AcademicDoc.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /academics/:id error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

export default router;
