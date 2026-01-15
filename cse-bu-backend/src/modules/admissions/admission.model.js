import { Schema, model, Types } from "mongoose";

const fileSchema = new Schema(
  {
    url: String,
    secureUrl: String,
    publicId: String,
    format: String,         // "pdf"
    resourceType: String,   // "raw"
    bytes: Number,
    originalFilename: String,
    kind: { type: String, enum: ["pdf"], required: true },
  },
  { _id: false }
);

const admissionSchema = new Schema(
  {
    title: { type: String, required: true },
    level: { type: String, enum: ["undergraduate", "postgraduate"], required: true },
    session: { type: String, required: true }, // e.g., "Spring 2026"
    noticeDate: { type: Date, required: true },
    issuedBy: { type: String, required: true },
    description: String,
    file: { type: fileSchema, required: true }, // Cloudinary PDF metadata from frontend
    createdBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Admission = model("Admission", admissionSchema);
