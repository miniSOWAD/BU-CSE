// backend/scripts/ensure-admin.js
import "dotenv/config.js";
import mongoose from "mongoose";
import { User } from "../src/modules/users/user.model.js";

const email = process.env.ADMIN_EMAIL || "admin@bu.ac.bd";
const password = process.env.ADMIN_PASSWORD || "Admin@123";

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    user = new User({
      email: email.toLowerCase(),
      name: "Site Admin",
      role: "admin",
      status: "approved",
    });
    await user.setPassword(password);
    await user.save();
    console.log("✅ Admin created:", email);
  } else {
    user.role = "admin";
    user.status = "approved";
    await user.setPassword(password); // reset to known password
    await user.save();
    console.log("✅ Admin updated & approved:", email);
  }

  await mongoose.disconnect();
})();
