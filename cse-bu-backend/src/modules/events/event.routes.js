import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";
import { Event } from "./event.model.js";

const router = Router();

// Public: list
router.get("/", async (_req, res) => {
  const events = await Event.find().sort({ startsAt: 1 });
  res.json(events);
});

// Create (cover comes from frontend upload; we just store it)
router.post("/", requireAuth, allow("admin","teacher","staff","cr"), async (req, res) => {
  const { title, description, startsAt, endsAt, location, cover } = req.body;
  if (!title || !startsAt || !endsAt) {
    return res.status(400).json({ message: "title, startsAt, endsAt are required" });
  }
  const event = await Event.create({
    title,
    description,
    startsAt,
    endsAt,
    location,
    cover: cover || null,
    createdBy: req.user.id,
  });
  res.status(201).json(event);
});

// Update (replace stored cover if provided — no Cloudinary delete)
router.put("/:id", requireAuth, allow("admin","teacher","staff"), async (req, res) => {
  const { title, description, startsAt, endsAt, location, cover } = req.body;
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Not found" });

  if (title !== undefined) event.title = title;
  if (description !== undefined) event.description = description;
  if (startsAt !== undefined) event.startsAt = startsAt;
  if (endsAt !== undefined) event.endsAt = endsAt;
  if (location !== undefined) event.location = location;
  if (cover !== undefined) event.cover = cover; // simply overwrite

  const updated = await event.save();
  res.json(updated);
});

// Delete (we only delete DB doc; asset remains in Cloudinary)
router.delete("/:id", requireAuth, allow("admin","teacher","staff"), async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
