import { Schema, model, Types } from "mongoose";

const paymentSchema = new Schema(
  {
    tranId: { type: String, index: true, unique: true },

    user: { type: Types.ObjectId, ref: "User", required: true },
    roll: { type: String, required: true },
    semester: { type: String, required: true },

    purpose: { type: String, enum: ["semester_fee", "admission_fee", "welfare_fee", "other"], required: true },
    otherDescription: { type: String, default: "" },

    method: { type: String, enum: ["mobile_banking", "card", "other"], required: true },
    amount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ["initiated", "success", "failed", "canceled"], default: "initiated" },

    gateway: { type: String, default: "sslcommerz" },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment = model("Payment", paymentSchema);
