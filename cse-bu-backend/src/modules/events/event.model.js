import { Schema, model, Types } from "mongoose";

const coverSchema = new Schema(
  {
    url: String,
    secureUrl: String,
    publicId: String,
    format: String,
    resourceType: String, // "image"
    bytes: Number,
    width: Number,
    height: Number,
    originalFilename: String,
    kind: { type: String, enum: ["image"], default: "image" },
  },
  { _id: false }
);

const eventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    location: String,
    cover: coverSchema,         // purely stored, no server Cloudinary calls
    createdBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Event = model("Event", eventSchema);
