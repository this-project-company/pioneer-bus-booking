import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminFromCookie } from "@/lib/auth";
import Booking from "@/models/Booking";

function hasOverlap(
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string
): boolean {
  return existingStart <= newEnd && existingEnd >= newStart;
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
    const { status, amount, isPaid } = body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (status === "confirmed" && booking.status !== "confirmed") {
      const conflicts = await Booking.find({
        _id: { $ne: id },
        busId: booking.busId,
        status: "confirmed",
        startDate: { $lte: booking.endDate },
        endDate: { $gte: booking.startDate },
      });

      const overlapping = conflicts.filter((b) =>
        hasOverlap(b.startDate, b.endDate, booking.startDate, booking.endDate)
      );

      if (overlapping.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot confirm: dates overlap with another confirmed booking",
          },
          { status: 409 }
        );
      }

      booking.status = "confirmed";
      if (amount !== undefined) booking.amount = Number(amount);
    } else if (status === "cancelled") {
      booking.status = "cancelled";
    } else if (status === "pending") {
      booking.status = "pending";
    }

    if (isPaid !== undefined) booking.isPaid = Boolean(isPaid);
    if (amount !== undefined && status !== "confirmed") {
      booking.amount = Number(amount);
    }

    await booking.save();

    const populated = await Booking.findById(id).populate("busId", "name").lean();
    return NextResponse.json({ booking: populated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
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
    await Booking.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
