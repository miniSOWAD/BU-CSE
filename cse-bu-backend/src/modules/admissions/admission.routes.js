import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";
import { Admission } from "./admission.model.js";

const router = Router();

// List: optional filter by level (?level=undergraduate|postgraduate)
router.get("/", async (req, res) => {
  try {
    const { level } = req.query;
    const q = {};
    if (level && level !== "all") q.level = level;
    const items = await Admission.find(q).sort({ noticeDate: -1, createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error("GET /admissions error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Create (admin only) – change roles in allow(...) if needed
router.post("/", requireAuth, allow("admin"), async (req, res) => {
  try {
    const { title, level, session, noticeDate, issuedBy, description, file } = req.body;

    if (!title || !level || !session || !noticeDate || !issuedBy || !file) {
      return res.status(400).json({ message: "title, level, session, noticeDate, issuedBy and file are required" });
    }
    if (!["undergraduate", "postgraduate"].includes(level)) {
      return res.status(400).json({ message: "Invalid level value" });
    }
    if (file?.kind !== "pdf") {
      return res.status(400).json({ message: "file.kind must be 'pdf'" });
    }

    const doc = await Admission.create({
      title,
      level,
      session,
      noticeDate,
      issuedBy,
      description,
      file,
      createdBy: req.user.id,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("POST /admissions error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// Update (admin only)
router.put("/:id", requireAuth, allow("admin"), async (req, res) => {
  try {
    const { title, level, session, noticeDate, issuedBy, description, file } = req.body;
    const doc = await Admission.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    if (title !== undefined) doc.title = title;
    if (level !== undefined) {
      if (!["undergraduate", "postgraduate"].includes(level)) {
        return res.status(400).json({ message: "Invalid level value" });
      }
      doc.level = level;
    }
    if (session !== undefined) doc.session = session;
    if (noticeDate !== undefined) doc.noticeDate = noticeDate;
    if (issuedBy !== undefined) doc.issuedBy = issuedBy;
    if (description !== undefined) doc.description = description;
    if (file !== undefined) {
      if (file && file.kind !== "pdf") {
        return res.status(400).json({ message: "file.kind must be 'pdf'" });
      }
      doc.file = file || doc.file;
    }

    const updated = await doc.save();
    res.json(updated);
  } catch (e) {
    console.error("PUT /admissions/:id error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

// Delete (admin only)
router.delete("/:id", requireAuth, allow("admin"), async (req, res) => {
  try {
    await Admission.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /admissions/:id error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
});

export default router;
