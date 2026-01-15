import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../users/user.model.js";
import {
  requireAuth,
  setAuthCookies,
  clearAuthCookies,
} from "../../middleware/auth.js";

const router = Router();

/**
 * Helper: sign a JWT with custom expiry (default 365d = "until logout" UX).
 * We put only minimal claims in the token.
 */
function signToken(user, expiresIn = "365d") {
  const payload = {
    id: String(user._id || user.id),
    role: user.role,
    name: user.name || "",
    status: user.status, // "approved" | "pending" | "rejected"
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * POST /api/auth/register
 * Body: { email, password, name? }
 * - Creates a new user with status "pending" by default (admin can approve later)
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name = "" } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() }).lean();
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const user = new User({
      email: email.toLowerCase(),
      name,
      role: "student",   // default
      status: "pending", // default
    });
    await user.setPassword(password);
    await user.save();

    return res.status(201).json({
      ok: true,
      message: "Registered successfully. Awaiting approval.",
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password, remember? }
 * - On success: sets long-lived cookies so user stays logged in until logout
 *   (365d by default; if you want shorter, pass remember=false and we’ll use 30d)
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, remember = true } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Need passwordHash for comparison (it's select: false in the model)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) return res.status(401).json({ message: "Login failed" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Login failed" });

    // We allow login regardless of approval; routes can still requireApproved when needed.
    const expiresIn = remember ? "365d" : "30d";
    const token = signToken(user, expiresIn);

    // Set "token" (httpOnly) and "me" (readable) cookies
    const safe = setAuthCookies(res, token, user);

    return res.json({ ok: true, token, user: safe });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/auth/me
 * - Requires valid token (from cookie or Authorization header)
 * - Returns normalized user claims from the token
 */
router.get("/me", requireAuth, async (req, res) => {
  // Optionally hydrate extra fields from DB if you want
  // const dbUser = await User.findById(req.user.id).select("-passwordHash");
  return res.json({ ok: true, user: req.user });
});

/**
 * POST /api/auth/refresh
 * - Re-issues a fresh token & cookies (useful if you want sliding sessions)
 */
router.post("/refresh", requireAuth, async (req, res, next) => {
  try {
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) return res.status(401).json({ message: "Unauthorized" });

    const token = signToken(dbUser, "365d");
    const safe = setAuthCookies(res, token, dbUser);
    return res.json({ ok: true, token, user: safe });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/logout
 * - Clears cookies so user is logged out
 */
router.post("/logout", (req, res) => {
  clearAuthCookies(res);
  return res.json({ ok: true });
});

export default router;
