import { Router } from "express";
import { Research } from "./research.model.js";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";

const router = Router();

/**
 * Public list: only approved researches unless admin views via status filter.
 * /api/research?status=approved|pending|rejected
 */
router.get("/", async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && ["pending","approved","rejected"].includes(status)) {
    filter.status = status;
  } else {
    // default: public should see only approved
    filter.status = "approved";
  }
  const items = await Research.find(filter).sort({ approvedAt: -1, createdAt: -1 });
  res.json(items);
});

/**
 * Create research request (teacher or admin/staff as you wish)
 * FRONTEND uploads to Cloudinary first, then sends report/photo asset objects here.
 */
router.post("/", requireAuth, allow("teacher","admin","staff"), async (req, res) => {
  const {
    title, abstract,
    leadName, teammates = [],
    report, photo,
  } = req.body;

  if (!title || !leadName || !report || !photo) {
    return res.status(400).json({ message: "title, leadName, report (pdf) and photo are required" });
  }
  if (report?.kind !== "pdf" || photo?.kind !== "image") {
    return res.status(400).json({ message: "Invalid asset kinds (expect photo=image, report=pdf)" });
  }

  const doc = await Research.create({
    title, abstract,
    leadName,
    leadUser: req.user.id,
    teammates,
    report, photo,
    status: "pending",
    createdBy: req.user.id,
  });
  res.status(201).json(doc);
});

/** Approve */
router.put("/:id/approve", requireAuth, allow("admin"), async (req, res) => {
  const doc = await Research.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  doc.status = "approved";
  doc.rejectionReason = "";
  doc.approvedAt = new Date();
  await doc.save();
  res.json(doc);
});

/** Reject (with optional reason) */
router.put("/:id/reject", requireAuth, allow("admin"), async (req, res) => {
  const doc = await Research.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });
  doc.status = "rejected";
  doc.rejectionReason = req.body?.reason || "";
  doc.approvedAt = undefined;
  await doc.save();
  res.json(doc);
});

/** (Optional) Admin delete / update */
router.delete("/:id", requireAuth, allow("admin"), async (req, res) => {
  await Research.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.put("/:id", requireAuth, allow("admin"), async (req, res) => {
  const updated = await Research.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

export default router;
