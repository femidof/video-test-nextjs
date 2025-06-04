import mongoose, { Schema, Document } from "mongoose";

export interface IVideo extends Document {
  title: string;
  filename: string;
  originalName: string;
  size: number;
  duration?: number;
  bunnyVideoId: string;
  bunnyLibraryId: string;
  status: "uploading" | "processing" | "ready" | "failed";
  thumbnailUrl?: string;
  playbackUrl?: string;
  uploadedAt: Date;
  processedAt?: Date;
}

const VideoSchema = new Schema<IVideo>({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  duration: { type: Number },
  bunnyVideoId: { type: String, required: true },
  bunnyLibraryId: { type: String, required: true },
  status: {
    type: String,
    enum: ["uploading", "processing", "ready", "failed"],
    default: "uploading",
  },
  thumbnailUrl: { type: String },
  playbackUrl: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
});

export const Video =
  mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema);
