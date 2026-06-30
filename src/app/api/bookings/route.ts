import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminFromCookie } from "@/lib/auth";
import Booking from "@/models/Booking";
import Bus from "@/models/Bus";

// Mock bus IDs that are valid without a DB connection
const MOCK_BUS_IDS = new Set(["mock_001", "mock_002", "mock_003"]);

function hasOverlap(
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string
): boolean {
  return existingStart <= newEnd && existingEnd >= newStart;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const busId = searchParams.get("busId");
    const status = searchParams.get("status");
    const isPaid = searchParams.get("isPaid");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (busId) query.busId = busId;
    if (status) query.status = status;
    if (isPaid !== null && isPaid !== "") query.isPaid = isPaid === "true";

    const bookings = await Booking.find(query)
      .populate("busId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { busId, customerPhone, startDate, endDate } = body;

    // ── Shared validation (runs in both mock and DB mode) ──
    if (!busId || !customerPhone || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Bus, phone, start date, and end date are required" },
        { status: 400 }
      );
    }

    const phoneRegex = /^[+]?[\d\s\-().]{7,15}$/;
    if (!phoneRegex.test(customerPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    if (startDate < today) {
      return NextResponse.json({ error: "Cannot book past dates" }, { status: 400 });
    }

    // ── Mock mode — no DB needed ──
    if (!process.env.MONGODB_URI) {
      if (!MOCK_BUS_IDS.has(busId)) {
        return NextResponse.json(
          { error: "Bus not found or not available" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          booking: {
            _id: `mock_bkg_${Date.now()}`,
            busId,
            customerPhone,
            startDate,
            endDate,
            status: "pending",
            isPaid: false,
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }

    // ── DB mode ──
    await connectDB();

    const bus = await Bus.findById(busId);
    if (!bus || !bus.isActive) {
      return NextResponse.json(
        { error: "Bus not found or not available" },
        { status: 404 }
      );
    }

    const conflicts = await Booking.find({
      busId,
      status: "confirmed",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    const overlapping = conflicts.filter((b) =>
      hasOverlap(b.startDate, b.endDate, startDate, endDate)
    );

    if (overlapping.length > 0) {
      return NextResponse.json(
        { error: "Selected dates overlap with an existing confirmed booking" },
        { status: 409 }
      );
    }

    const booking = await Booking.create({
      busId,
      customerPhone,
      startDate,
      endDate,
      status: "pending",
      isPaid: false,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
