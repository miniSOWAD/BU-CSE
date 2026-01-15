import { Schema, model, Types } from "mongoose";

const ROOM_KEYS = ["classroom1", "apl", "anl", "iot", "dld"];

const roomBookingSchema = new Schema(
  {
    roomKey: { type: String, enum: ROOM_KEYS, required: true, unique: true }, // one active booking per room
    teacherId: { type: Types.ObjectId, ref: "Person" }, // optional ref to People collection
    teacherName: { type: String, required: true },       // denormalized for quick view
    session: { type: String, required: true },           // batch session (eg 2019-20)
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const RoomBooking = model("RoomBooking", roomBookingSchema);
