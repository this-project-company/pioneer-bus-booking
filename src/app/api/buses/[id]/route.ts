import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminFromCookie } from "@/lib/auth";
import Bus from "@/models/Bus";

const MOCK_BUS_MAP: Record<string, {
  _id: string; name: string; description: string; capacity: number;
  features: string[]; imageUrl: string; isActive: boolean;
}> = {
  mock_001: {
    _id: "mock_001",
    name: "Pioneer Royal Coach",
    description: "Pioneer Holidays' premier 45-seat luxury coach — our flagship vehicle serving Kerala's roads since 1947. Built for long-haul comfort across Munnar, Wayanad, Alleppey, and Thekkady. Ideal for large tour groups, corporate outings, and pilgrimage parties.",
    capacity: 45,
    features: ["Air Conditioning","Reclining Seats","Onboard WiFi","USB Charging Ports","Entertainment System","Panoramic Windows","Refreshment Station","Restroom Onboard"],
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=800&fit=crop",
    isActive: true,
  },
  mock_002: {
    _id: "mock_002",
    name: "Pioneer Horizon Express",
    description: "A 35-seat mid-size coach perfect for medium-sized tour groups, pilgrimage parties, and holiday packages. Nimble enough for Kerala's mountain roads yet spacious enough for all-day comfort on inter-state routes.",
    capacity: 35,
    features: ["Air Conditioning","Reclining Seats","Onboard WiFi","USB Charging Ports","Entertainment System","Large Windows"],
    imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=800&fit=crop",
    isActive: true,
  },
  mock_003: {
    _id: "mock_003",
    name: "Pioneer Summit Cruiser",
    description: "Compact 22-seat mountain specialist — built for small groups on Kerala's high-altitude routes. Perfect for family pilgrimages, intimate Munnar tea estate tours, and corporate team outings on winding hill roads.",
    capacity: 22,
    features: ["Air Conditioning","Reclining Seats","USB Charging Ports","Panoramic Windows","Mountain-Ready Suspension"],
    imageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&h=800&fit=crop",
    isActive: true,
  },
};


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!process.env.MONGODB_URI) {
    const bus = MOCK_BUS_MAP[id];
    if (!bus) return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    return NextResponse.json({ bus });
  }

  try {
    await connectDB();
    const bus = await Bus.findById(id).lean();

    if (!bus) {
      return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    }

    return NextResponse.json({ bus });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bus" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const allowed = ["name", "description", "capacity", "features", "imageUrl", "isActive"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const bus = await Bus.findByIdAndUpdate(id, update, { new: true });

    if (!bus) {
      return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    }

    return NextResponse.json({ bus });
  } catch {
    return NextResponse.json({ error: "Failed to update bus" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const bus = await Bus.findByIdAndDelete(id);

    if (!bus) {
      return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete bus" }, { status: 500 });
  }
}
