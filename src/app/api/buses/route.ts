import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminFromCookie } from "@/lib/auth";
import Bus from "@/models/Bus";

const MOCK_BUSES = [
  {
    _id: "mock_001",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "mock_002",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "mock_003",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "mock_004",
    name: "Pioneer City Liner",
    description:
      "A sleek, city-ready coach built for urban group transfers, airport shuttles, and day tours. Compact yet comfortable, the City Liner handles busy roads with ease.",
    capacity: 22,
    features: [
      "Air Conditioning",
      "Luggage Racks",
      "USB Charging",
      "Comfortable Seating",
      "Large Windows",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1464219551459-ac14ae01fbe0?w=1200&h=800&fit=crop",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "mock_005",
    name: "Pioneer Heritage Voyager",
    description:
      "Classic styling meets modern reliability in the Heritage Voyager. Ideal for wedding convoys, temple tours, and special events where presentation matters as much as comfort.",
    capacity: 40,
    features: [
      "Air Conditioning",
      "Decorated Interior",
      "Reclining Seats",
      "PA System",
      "USB Charging",
      "Premium Curtains",
      "Mood Lighting",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=800&fit=crop",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function autoSeedIfEmpty() {
  const count = await Bus.countDocuments();
  if (count === 0) {
    await Bus.insertMany(
      MOCK_BUSES.map(({ _id: _ignored, createdAt: _c, updatedAt: _u, ...rest }) => rest)
    );
  }
}

export async function GET(request: NextRequest) {
  // Return mock data immediately when no DB is configured (dev / demo mode)
  if (!process.env.MONGODB_URI) {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const buses = activeOnly ? MOCK_BUSES.filter((b) => b.isActive) : MOCK_BUSES;
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
    return NextResponse.json({ error: "Failed to fetch buses" }, { status: 500 });
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
        { status: 400 }
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
    return NextResponse.json({ error: "Failed to create bus" }, { status: 500 });
  }
}
