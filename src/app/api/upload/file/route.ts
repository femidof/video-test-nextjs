import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { File } from "@/models/File";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Bunny Storage
    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;

    const uploadResponse = await fetch(
      `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE_NAME}/${fileName}`,
      {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY!,
          "Content-Type": file.type,
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to Bunny Storage");
    }

    // Determine file type
    let fileType: "image" | "document" | "other" = "other";
    if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text")
    ) {
      fileType = "document";
    }

    // Save file record to database
    const fileRecord = new File({
      filename: fileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      bunnyUrl: `https://${process.env.BUNNY_STORAGE_ZONE_NAME}.b-cdn.net/${fileName}`,
      fileType,
    });

    await fileRecord.save();

    return NextResponse.json({
      fileId: fileRecord._id,
      url: fileRecord.bunnyUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
