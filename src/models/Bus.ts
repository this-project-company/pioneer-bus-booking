import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBus extends Document {
  name: string;
  description: string;
  capacity: number;
  features: string[];
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusSchema = new Schema<IBus>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    features: { type: [String], default: [] },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Bus: Model<IBus> =
  mongoose.models.Bus || mongoose.model<IBus>("Bus", BusSchema);

export default Bus;
