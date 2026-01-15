// backend/src/modules/research/research.model.js
import { Schema, model, Types } from "mongoose";

const assetSchema = new Schema(
  {
    url: String,
    secureUrl: String,
    publicId: String,
    format: String,
    resourceType: String,
    bytes: Number,
    width: Number,
    height: Number,
    originalFilename: String,
    kind: { type: String, enum: ["image","pdf"], required: true },
  },
  { _id: false }
);

const teammateSchema = new Schema(
  {
    name: { type: String, required: true },
    email: String,
  },
  { _id: false }
);

const researchSchema = new Schema(
  {
    title: { type: String, required: true },
    abstract: { type: String, default: "" },

    leadName: { type: String, required: true },
    leadUser: { type: Types.ObjectId, ref: "User" }, // optional
    teammates: [teammateSchema], // array of {name,email?}

    report: assetSchema,   // { kind: "pdf", ... } (optional)
    photo: assetSchema,    // { kind: "image", ... } (lead photo)

    status: { type: String, enum: ["pending","approved","rejected"], default: "pending", index: true },
    rejectionReason: { type: String, default: "" },
    approvedAt: { type: Date },

    createdBy: { type: Types.ObjectId, ref: "User" }, // requester
  },
  { timestamps: true }
);

export const Research = model("Research", researchSchema);
export default Research; // (export default too, in case other files import default)
