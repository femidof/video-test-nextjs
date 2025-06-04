import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { File } from "@/models/File";

export async function GET() {
  try {
    await connectDB();

    const files = await File.find({}).sort({ uploadedAt: -1 });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
