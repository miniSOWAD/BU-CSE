// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./src/config/db.js";

import authRoutes from "./src/modules/auth/auth.routes.js";
import userRoutes from "./src/modules/users/user.routes.js";
import noticeRoutes from "./src/modules/notices/notice.routes.js";
import eventRoutes from "./src/modules/events/event.routes.js";
import personRoutes from "./src/modules/people/person.routes.js";
import academicsRoutes from "./src/modules/academics/academics.routes.js";
import researchRoutes from "./src/modules/research/research.routes.js";
import admissionRoutes from "./src/modules/admissions/admission.routes.js";
import adminRoutes from "./src/modules/admin/admin.routes.js";
import alumniRoutes from "./src/modules/alumni/alumni.routes.js";
import roomBookingRoutes from "./src/modules/roomBookings/roomBooking.routes.js";
import paymentRoutes from "./src/modules/payment/payment.routes.js";

const app = express();

// If you're behind a proxy (Railway/Render/Heroku/NGINX), this helps secure cookies work in prod
app.set("trust proxy", 1);

// CORS (allow cookies from your frontend)
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true, // <-- allow cookies
  })
);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Logging + body parsing + cookies
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (_, res) => res.json({ ok: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/people", personRoutes);
app.use("/api/academics", academicsRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/room-bookings", roomBookingRoutes);
app.use("/api/payments", paymentRoutes);

// IMPORTANT: remove the duplicate mount of user routes at "/api"
// app.use("/api", userRoutes);  // ❌ delete this line

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = Number(process.env.PORT) || 5000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 API http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });
