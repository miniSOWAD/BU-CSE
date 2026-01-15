import { Schema, model } from "mongoose";

const programSchema = new Schema({
  name: { type: String, required: true },   // BSc in CSE
  code: { type: String },
  description: String,
  courses: [{
    code: String,
    title: String,
    credits: Number,
    semester: Number
  }],
}, { timestamps: true });

export const Program = model("Program", programSchema);
