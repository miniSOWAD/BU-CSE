import { User } from "./user.model.js";
import { cloudinary } from "../../lib/cloudinary.js";
import streamifier from "streamifier";

/** GET /me */
export async function getMe(req, res) {
  const userId = req.user?.id; // set by requireAuth
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  // Return only profile-relevant fields
  const {
    _id, email, role, approved, userCode, name, roll, regNo, session, semester,
    phone, cgpas, photo, createdAt, updatedAt
  } = user;

  res.json({
    _id, email, role, approved, userCode, name, roll, regNo, session, semester,
    phone, cgpas, photo, createdAt, updatedAt
  });
}

/** PUT /me */
export async function updateMe(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const {
    name, roll, regNo, session, semester, phone, cgpas
  } = req.body || {};

  // Basic validation: if semester provided, cgpas must be length = max(0, semester-1)
  let update = {};
  if (name !== undefined) update.name = name?.trim();
  if (roll !== undefined) update.roll = roll?.trim();
  if (regNo !== undefined) update.regNo = regNo?.trim();
  if (session !== undefined) update.session = session?.trim();
  if (semester !== undefined) {
    const s = Number(semester);
    if (Number.isNaN(s) || s < 1) return res.status(400).json({ message: "Invalid semester" });
    update.semester = s;
    if (cgpas !== undefined) {
      if (!Array.isArray(cgpas)) {
        return res.status(400).json({ message: "cgpas must be an array" });
      }
      if (cgpas.length !== Math.max(0, s - 1)) {
        return res.status(400).json({ message: `cgpas length must be ${Math.max(0, s - 1)}` });
      }
      if (!cgpas.every((x) => typeof x === "number" && x >= 0 && x <= 4.0)) {
        return res.status(400).json({ message: "cgpas must be numbers in [0, 4.0]" });
      }
      update.cgpas = cgpas;
    }
  } else if (cgpas !== undefined) {
    // If semester not in payload, we still can update cgpas but we need to check against existing semester
    const current = await User.findById(userId, "semester").lean();
    const s = current?.semester || 0;
    if (cgpas.length !== Math.max(0, s - 1)) {
      return res.status(400).json({ message: `cgpas length must be ${Math.max(0, s - 1)} for semester ${s}` });
    }
    update.cgpas = cgpas;
  }

  if (phone !== undefined) update.phone = phone?.trim();

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
  res.json(user);
}

/** POST /me/avatar  (multer memory -> Cloudinary) */
export async function uploadAvatar(req, res) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // Upload buffer to Cloudinary
  const buffer = req.file.buffer;
  const originalname = req.file.originalname || "avatar";

  const uploadFromBuffer = (buffer) =>
    new Promise((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        { folder: "cse-bu/avatars", resource_type: "image" },
        (err, result) => {
          if (err) return reject(err);
          return resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(cldStream);
    });

  try {
    const result = await uploadFromBuffer(buffer);
    const asset = {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      originalFilename: originalname,
      kind: "image",
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { photo: asset },
      { new: true }
    ).lean();

    res.json({ photo: user.photo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Cloudinary upload failed" });
  }
}
