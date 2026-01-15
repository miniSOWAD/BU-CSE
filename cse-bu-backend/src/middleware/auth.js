// src/middleware/auth.js
import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Extract a Bearer token from Authorization header or "token" cookie.
 */
function getToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

/**
 * Sign a JWT that the server will verify later.
 * Put ONLY what you need in here.
 */
export function signAccessToken(user) {
  const payload = {
    id: String(user._id || user.id),
    role: user.role,
    name: user.name,
    status: user.status, // "approved" | "pending" | "rejected"
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Set auth cookies:
 * - "token" (HTTP-only) for server auth
 * - "me" (readable) for client UI state on refresh/SSR
 */
export function setAuthCookies(res, token, user) {
  // HTTP-only auth token cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  // Safe public snapshot of user for client (NO secrets)
  const safeUser = {
    id: String(user._id || user.id),
    name: user.name || "",
    email: user.email || "",
    role: user.role,
    status: user.status,
    avatar: user.avatar?.url || "",
  };

  res.cookie("me", JSON.stringify(safeUser), {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return safeUser;
}

/**
 * Clear both cookies (logout).
 */
export function clearAuthCookies(res) {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("me", { path: "/" });
}

/**
 * requireAuth
 * - Verifies JWT from header or cookie
 * - Normalizes req.user to always have { id, _id, role, name, status }
 */
export const requireAuth = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const id = String(payload.id || payload._id || "");
    req.user = {
      ...payload,
      id,
      _id: id,
      role: payload.role,
      name: payload.name,
      status: payload.status,
    };
    res.locals.user = req.user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * optionalUser
 * - If a valid token exists, attaches req.user and refreshes "me" cookie.
 * - If token missing/invalid, continues without throwing.
 *   Useful for public pages that render differently when logged in.
 */
export function optionalUser(req, res, next) {
  const token = getToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const id = String(payload.id || payload._id || "");
    req.user = { ...payload, id, _id: id };
    res.locals.user = req.user;

    // Keep the "me" cookie fresh (if missing or stale)
    if (!req.cookies?.me) {
      const safeUser = {
        id,
        name: payload.name || "",
        email: payload.email || "",
        role: payload.role,
        status: payload.status,
      };
      res.cookie("me", JSON.stringify(safeUser), {
        httpOnly: false,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });
    }
  } catch {
    // If token is bad, clear cookies and continue
    clearAuthCookies(res);
  }
  return next();
}

/**
 * allow(...roles) — gate by role after requireAuth.
 */
export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

/**
 * requireApproved — block non-approved accounts (admins bypass).
 */
export function requireApproved(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role === "admin") return next();
  if (req.user.status && req.user.status !== "approved") {
    return res.status(403).json({ message: "Account not approved yet" });
  }
  return next();
}

/**
 * allowSelfOr(...roles) — allow the resource owner or privileged roles.
 */
export function allowSelfOr(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const paramId = String(req.params.id || "");
    if (paramId && (paramId === req.user.id || paramId === req.user._id)) {
      return next();
    }
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}
