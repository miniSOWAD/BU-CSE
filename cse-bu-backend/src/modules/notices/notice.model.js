import { Schema, model, Types } from "mongoose";

const attachmentSchema = new Schema(
  {
    url: String,
    secureUrl: String,
    publicId: String,
    format: String,
    resourceType: String, // "image" | "raw"
    bytes: Number,
    width: Number,
    height: Number,
    originalFilename: String,
    kind: { type: String, enum: ["image", "pdf"], required: true },
  },
  { _id: false }
);

const noticeSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String },
    tags: [{ type: String }],
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    attachment: attachmentSchema,
    createdBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Notice = model("Notice", noticeSchema);
