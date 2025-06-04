import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Video } from "@/models/Video";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = await params;

    const video = await Video.findById(id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Check video status from Bunny
    const response = await fetch(
      `https://video.bunnycdn.com/library/${video.bunnyLibraryId}/videos/${video.bunnyVideoId}`,
      {
        headers: {
          AccessKey: process.env.BUNNY_STREAM_API_KEY!,
        },
      }
    );

    if (response.ok) {
      const bunnyVideo = await response.json();

      // Update video status based on Bunny response
      if (bunnyVideo.status === 4) {
        // Ready
        video.status = "ready";
        console.log("Video is ready in Bunny Stream", video.toString());
        video.thumbnailUrl = bunnyVideo.thumbnailFileName
          ? `https://vz-${bunnyVideo.storageZoneName}.b-cdn.net/${video.bunnyVideoId}/${bunnyVideo.thumbnailFileName}`
          : undefined;
        video.playbackUrl = `https://iframe.mediadelivery.net/embed/${video.bunnyLibraryId}/${video.bunnyVideoId}`;
        video.processedAt = new Date();
      } else if (bunnyVideo.status === 5) {
        // Failed
        video.status = "failed";
      } else if (bunnyVideo.status === 3) {
        // Processing
        video.status = "processing";
      }

      await video.save();
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("Error checking video status:", error);
    return NextResponse.json(
      { error: "Failed to check video status" },
      { status: 500 }
    );
  }
}
