import mongoose, { Schema, Document } from "mongoose";

export interface IFile extends Document {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  bunnyUrl?: string; // For general file storage
  fileType: "image" | "document" | "other";
}

const FileSchema = new Schema<IFile>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  bunnyUrl: { type: String },
  fileType: {
    type: String,
    enum: ["image", "document", "other"],
    required: true,
  },
});

export const File =
  mongoose.models.File || mongoose.model<IFile>("File", FileSchema);
