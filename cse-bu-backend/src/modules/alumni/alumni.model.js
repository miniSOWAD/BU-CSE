import { Schema, model } from "mongoose";

const alumniSchema = new Schema(
  {
    name: { type: String, required: true },
    batch: { type: String, required: true },       // e.g., "2016-17"
    currentPosition: { type: String },             // e.g., "SWE @ Google"
    company: { type: String },
    email: { type: String, lowercase: true, trim: true },
    linkedIn: { type: String },
    photoUrl: { type: String },
    bio: { type: String },
    featured: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Alumni = model("Alumni", alumniSchema);
