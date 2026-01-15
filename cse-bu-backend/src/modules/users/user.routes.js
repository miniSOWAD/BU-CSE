import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";
import { User } from "./user.model.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a Buffer to Cloudinary
function uploadBuffer(buffer, folder = "cse-bu/avatars") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

/* ----------------------- ADMIN: List users ----------------------- */
// GET /api/users?q=&role=&status=&page=&limit=
router.get("/", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const {
      q = "",
      role,
      status,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filters = {};
    if (q) {
      filters.$or = [
        { name:  { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { roll:  { $regex: q, $options: "i" } },
        { regNo: { $regex: q, $options: "i" } },
      ];
    }
    if (role) filters.role = role;
    if (status) filters.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const size = Math.min(100, Math.max(1, parseInt(limit)));

    const [items, total] = await Promise.all([
      User.find(filters)
        .select("-passwordHash")     // never send hash
        .sort(String(sort))
        .skip((pageNum - 1) * size)
        .limit(size),
      User.countDocuments(filters),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.ceil(total / size),
    });
  } catch (err) {
    next(err);
  }
});

/* ----------------------- ADMIN: Get by id ----------------------- */
// GET /api/users/:id
router.get("/:id", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/* ------------------ USER: Update own profile -------------------- */
// PUT /api/users/me/profile  (multipart/form-data)
router.put("/me/profile",
  requireAuth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const updates = {
        name:     req.body.name,
        roll:     req.body.roll,
        regNo:    req.body.regNo,
        session:  req.body.session,
        semester: req.body.semester,
        phone:    req.body.phone,
        cgpaHistory: req.body.cgpaHistory ? JSON.parse(req.body.cgpaHistory) : undefined,
      };

      if (req.file?.buffer) {
        const uploaded = await uploadBuffer(req.file.buffer);
        updates.avatar = {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          width: uploaded.width,
          height: uploaded.height,
          bytes: uploaded.bytes,
          format: uploaded.format,
        };
      }

      Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
        .select("-passwordHash");
      res.json({ ok: true, user });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
