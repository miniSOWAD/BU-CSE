import { Schema, model, Types } from "mongoose";

const fileSchema = new Schema(
  {
    url: String,
    secureUrl: String,
    publicId: String,
    format: String,         // "pdf"
    resourceType: String,   // "raw" (pdfs are raw in Cloudinary)
    bytes: Number,
    originalFilename: String,
    kind: { type: String, enum: ["pdf"], required: true }, // must be "pdf"
  },
  { _id: false }
);

const academicsSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["calendar", "routine", "form", "undergraduate", "graduate"],
      required: true,
    },
    description: String,
    year: Number,
    file: { type: fileSchema, required: true }, // PDF metadata from Cloudinary
    createdBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const AcademicDoc = model("AcademicDoc", academicsSchema);
