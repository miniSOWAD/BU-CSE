// backend/src/modules/admin/admin.routes.js
import { Router } from "express";
import { requireAuth, allow } from "../../middleware/auth.js";
import { User } from "../users/user.model.js";

const router = Router();

/**
 * GET /api/admin/users
 * Optional query: ?status=pending|approved|rejected
 */
router.get("/users", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    const users = await User.find(q, "-passwordHash").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * body: { role: "admin"|"teacher"|"faculty"|"staff"|"student"|"cr" }
 */
router.patch("/users/:id/role", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: "role is required" });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: "-passwordHash" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/admin/users/:id/approve
 * no body needed
 */
router.patch("/users/:id/approve", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedAt: new Date(), rejectionReason: "" },
      { new: true, select: "-passwordHash" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/admin/users/:id/reject
 * body: { reason: string }
 */
router.patch("/users/:id/reject", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: reason, approvedAt: null },
      { new: true, select: "-passwordHash" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete("/users/:id", requireAuth, allow("admin"), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
