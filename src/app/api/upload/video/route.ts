import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Video } from "@/models/Video";
import { generateBunnyStreamAuth } from "@/lib/bunnyAuthSig";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { title, filename, size } = await request.json();

    // Create video in Bunny Stream
    const response = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: process.env.BUNNY_STREAM_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
        }),
      }
    );
    // Check if the response is ok
    if (response.ok) {
      console.log("Video created in Bunny Stream");
    }

    if (!response.ok) {
      throw new Error("Failed to create video in Bunny Stream");
    }

    const bunnyVideo = await response.json();

    // Save video record to database
    const video = new Video({
      title,
      filename,
      originalName: filename,
      size,
      bunnyVideoId: bunnyVideo.guid,
      bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID!,
      status: "uploading",
    });

    await video.save();

    const { hash, expirationTime } = generateBunnyStreamAuth(
      process.env.BUNNY_STREAM_LIBRARY_ID!,
      process.env.BUNNY_STREAM_API_KEY!,
      bunnyVideo.guid,
      60
    );

    return NextResponse.json({
      videoId: video._id,
      bunnyVideoId: bunnyVideo.guid,
      tusEndpoint: `https://video.bunnycdn.com/tusupload`,
      metadata: {
        videoId: bunnyVideo.guid,
        libraryId: process.env.BUNNY_STREAM_LIBRARY_ID!,
        expirationTime,
        hash,
      },
    });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
