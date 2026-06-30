import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bus from "@/models/Bus";

const sampleBuses = [
  {
    name: "Pioneer Royal Coach",
    description:
      "Experience luxury travel in our flagship Royal Coach. Designed for premium group tours with state-of-the-art amenities and a spacious cabin that redefines comfort on the road.",
    capacity: 45,
    features: [
      "Air Conditioning",
      "Reclining Seats",
      "Onboard WiFi",
      "USB Charging Ports",
      "Entertainment System",
      "Panoramic Windows",
      "Refreshment Station",
      "Restroom Onboard",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=800&fit=crop",
    isActive: true,
  },
  {
    name: "Pioneer Horizon Express",
    description:
      "The Horizon Express combines speed and style for intercity adventures. Perfect for corporate outings, school trips, and weekend getaways with your entire group.",
    capacity: 35,
    features: [
      "Air Conditioning",
      "Reclining Seats",
      "USB Charging Ports",
      "Panoramic Windows",
      "Luggage Storage",
      "PA System",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&h=800&fit=crop",
    isActive: true,
  },
  {
    name: "Pioneer Summit Cruiser",
    description:
      "Built for mountain terrain and scenic routes, the Summit Cruiser is your ideal companion for hill station trips. Enhanced suspension and safety systems ensure a smooth, secure ride.",
    capacity: 28,
    features: [
      "Air Conditioning",
      "All-Terrain Suspension",
      "Emergency Kit",
      "Reclining Seats",
      "USB Charging",
      "Scenic View Roof Windows",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop",
    isActive: true,
  },
];

export async function POST() {
  try {
    await connectDB();
    const count = await Bus.countDocuments();

    if (count > 0) {
      return NextResponse.json({
        message: "Database already has buses, skipping seed",
        count,
      });
    }

    const buses = await Bus.insertMany(sampleBuses);
    return NextResponse.json({
      message: "Sample buses seeded successfully",
      count: buses.length,
    });
  } catch {
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Send POST to /api/seed to seed the database" });
}
