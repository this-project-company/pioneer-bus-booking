import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + "T00:00:00Z");
  const endDate = new Date(end + "T00:00:00Z");

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export async function GET(request: NextRequest) {
  // No DB configured — return empty blocked dates so the calendar works with mock buses
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ blockedDates: [] });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const busId = searchParams.get("busId");

    if (!busId) {
      return NextResponse.json({ error: "busId is required" }, { status: 400 });
    }

    const confirmedBookings = await Booking.find({
      busId,
      status: "confirmed",
    })
      .select("startDate endDate")
      .lean();

    const blockedDates = new Set<string>();
    for (const booking of confirmedBookings) {
      const dates = getDatesInRange(booking.startDate, booking.endDate);
      dates.forEach((d) => blockedDates.add(d));
    }

    return NextResponse.json({ blockedDates: Array.from(blockedDates) });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch blocked dates" },
      { status: 500 }
    );
  }
}
