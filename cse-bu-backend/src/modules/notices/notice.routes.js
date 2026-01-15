import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/rbac.js";
import { Notice } from "./notice.model.js";
import { v2 as cloudinary } from "cloudinary";

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const router = Router();

// Public
router.get("/", async (_req, res) => {
  const items = await Notice.find().sort({ publishedAt: -1 }).limit(100);
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const item = await Notice.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

// Create (attachment comes from client upload)
router.post("/", requireAuth, allow("admin","teacher","staff","cr"), async (req, res) => {
  try {
    const { title, body, tags, published, attachment } = req.body;
    if (!attachment?.url || !attachment?.kind) {
      return res.status(400).json({ message: "attachment (image/pdf) is required" });
    }
    const doc = await Notice.create({
      title,
      body,
      tags: tags ? [].concat(tags) : [],
      published: published !== undefined ? !!published : true,
      publishedAt: new Date(),
      createdBy: req.user.id,
      attachment,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Update (optionally delete previous asset when replacing)
router.put("/:id", requireAuth, allow("admin","teacher","staff","cr"), async (req, res) => {
  try {
    const { title, body, tags, published, attachment, prevPublicId } = req.body;
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Not found" });

    if (attachment) {
      // delete previous asset if requested & server has creds
      if (prevPublicId && process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const resType = notice.attachment?.resourceType || "image";
          await cloudinary.uploader.destroy(prevPublicId, { resource_type: resType });
        } catch (_) {}
      }
      notice.attachment = attachment;
    }
    if (title !== undefined) notice.title = title;
    if (body !== undefined) notice.body = body;
    if (tags !== undefined) notice.tags = [].concat(tags);
    if (published !== undefined) notice.published = !!published;

    const updated = await notice.save();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Delete (optional: delete cloud asset if server creds provided)
router.delete("/:id", requireAuth, allow("admin","teacher","staff"), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Not found" });

    if (notice.attachment?.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const resType = notice.attachment.resourceType || "image";
        await cloudinary.uploader.destroy(notice.attachment.publicId, { resource_type: resType });
      } catch (_) {}
    }
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
