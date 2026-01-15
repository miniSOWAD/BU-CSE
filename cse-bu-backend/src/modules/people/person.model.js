import { Schema, model } from "mongoose";

const personSchema = new Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true }, // Professor, Lecturer, Staff
  email: String,
  phone: String,
  photoUrl: String,
  bio: String,
  category: { type: String, enum: ["faculty","staff"], required: true },
}, { timestamps: true });

export const Person = model("Person", personSchema);
