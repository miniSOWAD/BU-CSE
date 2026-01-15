import { Schema, model } from "mongoose";

const publicationSchema = new Schema({
  title: { type: String, required: true },
  authors: [String],
  venue: String,
  year: Number,
  link: String,
},{ timestamps: true });

export const Publication = model("Publication", publicationSchema);
