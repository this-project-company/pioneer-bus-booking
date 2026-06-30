import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface IBooking extends Document {
  busId: Types.ObjectId;
  customerPhone: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  amount?: number;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    busId: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    customerPhone: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    amount: { type: Number, min: 0 },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BookingSchema.index({ busId: 1, status: 1, startDate: 1, endDate: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
