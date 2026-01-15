import "dotenv/config";
import bcrypt from "bcrypt";
import { connectDB } from "./config/db.js";
import { User } from "./modules/users/user.model.js";

await connectDB(process.env.MONGODB_URI);
const passwordHash = await bcrypt.hash("admin123", 10);

const admin = await User.findOneAndUpdate(
  { email: "admin@bu.ac.bd" },
  { name: "BU Admin", email: "admin@bu.ac.bd", passwordHash, role: "admin" },
  { upsert: true, new: true }
);

console.log("Seeded admin:", admin.email);
process.exit(0);
