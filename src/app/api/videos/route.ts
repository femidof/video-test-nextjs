import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Video } from "@/models/Video";

export async function GET() {
  try {
    await connectDB();

    const videos = await Video.find({}).sort({ uploadedAt: -1 });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
