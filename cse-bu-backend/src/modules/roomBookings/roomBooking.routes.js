import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";
import { RoomBooking } from "./roomBooking.model.js";
import { Person } from "../people/person.model.js";

const router = Router();

/** List current bookings (one per room max) */
router.get("/", async (_req, res) => {
  const docs = await RoomBooking.find()
    .populate("createdBy", "name")
    .populate("teacherId", "name");
  const out = docs.map((d) => ({
    _id: d._id,
    roomKey: d.roomKey,
    teacherName: d.teacherName || d.teacherId?.name,
    session: d.session,
    createdBy: d.createdBy, // {_id, name}
  }));
  res.json(out);
});

/** Create booking (CR only). One booking per room. */
router.post("/", requireAuth, allow("cr"), async (req, res) => {
  const { roomKey, teacherId, session } = req.body || {};
  if (!roomKey || !session || !teacherId) {
    return res.status(400).json({ message: "roomKey, teacherId, session are required" });
  }

  const exists = await RoomBooking.findOne({ roomKey });
  if (exists) return res.status(409).json({ message: "Room already booked" });

  const teacher = await Person.findById(teacherId);
  if (!teacher) return res.status(400).json({ message: "Invalid teacherId" });

  const doc = await RoomBooking.create({
    roomKey,
    teacherId,
    teacherName: teacher.name,
    session,
    createdBy: req.user.id,
  });

  res.status(201).json(doc);
});

/** Cancel booking — only owner or admin */
router.delete("/:id", requireAuth, async (req, res) => {
  const doc = await RoomBooking.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Not found" });

  const isOwner = String(doc.createdBy) === String(req.user.id);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await doc.deleteOne();
  res.json({ ok: true });
});

export default router;
