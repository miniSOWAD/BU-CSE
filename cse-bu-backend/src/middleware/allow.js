// backend/src/middleware/auth.js
export function requireAuth(req, res, next) {
  // ... your JWT/session auth that sets req.user
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  next();
}

export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
