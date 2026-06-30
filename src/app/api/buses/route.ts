import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminFromCookie } from "@/lib/auth";
import Bus from "@/models/Bus";

const MOCK_BUSES = [
  {
    _id: "mock_001",
    name: "Pioneer Royal Coach",
    description:
      "Pioneer Holidays' premier 45-seat luxury coach — our flagship vehicle serving Kerala's roads since 1947. Built for long-haul comfort across Munnar, Wayanad, Alleppey, and Thekkady. Ideal for large tour groups, corporate outings, and pilgrimage parties.",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "mock_002",
    name: "Pioneer Horizon Express",
    description:
      "A 35-seat mid-size coach perfect for medium-sized tour groups, pilgrimage parties, and holiday packages. Nimble enough for Kerala's mountain roads yet spacious enough for all-day comfort on inter-state routes.",
    capacity: 35,
    features: [
      "Air Conditioning",
      "Reclining Seats",
      "Onboard WiFi",
      "USB Charging Ports",
      "Entertainment System",
      "Large Windows",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=800&fit=crop",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "mock_003",
    name: "Pioneer Summit Cruiser",
    description:
      "Compact 22-seat mountain specialist — built for small groups on Kerala's high-altitude routes. Perfect for family pilgrimages, intimate Munnar tea estate tours, and corporate team outings on winding hill roads.",
    capacity: 22,
    features: [
      "Air Conditioning",
      "Reclining Seats",
      "USB Charging Ports",
      "Panoramic Windows",
      "Mountain-Ready Suspension",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&h=800&fit=crop",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function autoSeedIfEmpty() {
  const count = await Bus.countDocuments();
  if (count === 0) {
    await Bus.insertMany(
      MOCK_BUSES.map(
        ({ _id: _ignored, createdAt: _c, updatedAt: _u, ...rest }) => rest,
      ),
    );
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.MONGODB_URI) {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const buses = activeOnly
      ? MOCK_BUSES.filter((b) => b.isActive)
      : MOCK_BUSES;
    return NextResponse.json({ buses, _mock: true });
  }

  try {
    await connectDB();
    await autoSeedIfEmpty();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const query = activeOnly ? { isActive: true } : {};
    const buses = await Bus.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ buses });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch buses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const { name, description, capacity, features, imageUrl, isActive } = body;

    if (!name || !description || !capacity || !imageUrl) {
      return NextResponse.json(
        { error: "Name, description, capacity, and imageUrl are required" },
        { status: 400 },
      );
    }

    const bus = await Bus.create({
      name,
      description,
      capacity: Number(capacity),
      features: Array.isArray(features) ? features : [],
      imageUrl,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ bus }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create bus" },
      { status: 500 },
    );
  }
}
