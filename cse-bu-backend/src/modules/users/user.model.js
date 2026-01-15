// backend/src/modules/users/user.model.js
import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const avatarSchema = new Schema(
  {
    url: String,
    publicId: String,
    width: Number,
    height: Number,
    bytes: Number,
    format: String,
  },
  { _id: false }
);

const cgpaSchema = new Schema(
  {
    semNo: Number,
    cgpa: Number,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, default: "" },

    // IMPORTANT: include "teacher" (and keep "faculty" for backward compatibility)
    role: {
      type: String,
      enum: ["student", "cr", "teacher", "faculty", "staff", "admin"],
      default: "student",
    },

    // Approval flow fields used by admin endpoints
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: "" },

    // store the password hash only (never return by default)
    passwordHash: { type: String, select: false },

    // profile fields
    roll: String,
    regNo: String,
    session: String,
    semester: String,
    phone: String,
    avatar: avatarSchema,
    cgpaHistory: [cgpaSchema],
  },
  { timestamps: true }
);

// Helpers
userSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

userSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash || typeof this.passwordHash !== "string") return false;
  return bcrypt.compare(plain, this.passwordHash);
};

// Convenience virtual
userSchema.virtual("isApproved").get(function () {
  return this.status === "approved";
});

export const User = model("User", userSchema);
