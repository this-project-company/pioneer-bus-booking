import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminFromCookie } from "@/lib/auth";
import Bus from "@/models/Bus";

// Inline mock copy — self-contained so no circular imports
const MOCK_BUS_MAP: Record<string, {
  _id: string; name: string; description: string; capacity: number;
  features: string[]; imageUrl: string; isActive: boolean;
}> = {
  mock_001: {
    _id: "mock_001", name: "Pioneer Royal Coach",
    description: "Experience luxury travel in our flagship Royal Coach. Designed for premium group tours with state-of-the-art amenities and a spacious cabin that redefines comfort on the road.",
    capacity: 45,
    features: ["Air Conditioning","Reclining Seats","Onboard WiFi","USB Charging Ports","Entertainment System","Panoramic Windows","Refreshment Station","Restroom Onboard"],
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=800&fit=crop",
    isActive: true,
  },
  mock_002: {
    _id: "mock_002", name: "Pioneer Horizon Express",
    description: "The Horizon Express combines speed and style for intercity adventures. Perfect for corporate outings, school trips, and weekend getaways with your entire group.",
    capacity: 35,
    features: ["Air Conditioning","Reclining Seats","USB Charging Ports","Panoramic Windows","Luggage Storage","PA System"],
    imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&h=800&fit=crop",
    isActive: true,
  },
  mock_003: {
    _id: "mock_003", name: "Pioneer Summit Cruiser",
    description: "Built for mountain terrain and scenic routes, the Summit Cruiser is your ideal companion for hill station trips. Enhanced suspension and safety systems ensure a smooth, secure ride.",
    capacity: 28,
    features: ["Air Conditioning","All-Terrain Suspension","Emergency Kit","Reclining Seats","USB Charging","Scenic View Roof Windows"],
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop",
    isActive: true,
  },
  mock_004: {
    _id: "mock_004", name: "Pioneer City Liner",
    description: "A sleek, city-ready coach built for urban group transfers, airport shuttles, and day tours. Compact yet comfortable, the City Liner handles busy roads with ease.",
    capacity: 22,
    features: ["Air Conditioning","Luggage Racks","USB Charging","Comfortable Seating","Large Windows"],
    imageUrl: "https://images.unsplash.com/photo-1464219551459-ac14ae01fbe0?w=1200&h=800&fit=crop",
    isActive: true,
  },
  mock_005: {
    _id: "mock_005", name: "Pioneer Heritage Voyager",
    description: "Classic styling meets modern reliability in the Heritage Voyager. Ideal for wedding convoys, temple tours, and special events where presentation matters as much as comfort.",
    capacity: 40,
    features: ["Air Conditioning","Decorated Interior","Reclining Seats","PA System","USB Charging","Premium Curtains","Mood Lighting"],
    imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=800&fit=crop",
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
