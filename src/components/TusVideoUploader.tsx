"use client";

import { useState, useRef } from "react";
import { Upload, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface UploadState {
  progress: number;
  status: "idle" | "uploading" | "paused" | "completed" | "error";
  videoId?: string;
  error?: string;
}

export default function TusVideoUploader({
  onUploadComplete,
}: {
  onUploadComplete?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: "idle",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check if it's a video file
      if (!selectedFile.type.startsWith("video/")) {
        toast.error("Please select a video file");
        return;
      }

      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setUploadState({ progress: 0, status: "idle" });
    }
  };

  const startUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Please select a file and enter a title");
      return;
    }

    try {
      setUploadState({ progress: 0, status: "uploading" });

      // Initialize video upload
      const initResponse = await fetch("/api/upload/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          filename: file.name,
          size: file.size,
        }),
      });

      if (!initResponse.ok) {
        throw new Error("Failed to initialize upload");
      }

      const { videoId, bunnyVideoId, tusEndpoint, metadata } =
        await initResponse.json();

      // Dynamic import of tus-js-client
      const { Upload } = await import("tus-js-client");

      const upload = new Upload(file, {
        endpoint: tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          videoId: bunnyVideoId,
          libraryId: metadata.libraryId,
          filename: file.name,
        },
        headers: {
          AuthorizationSignature: metadata.hash,
          // process.env.NEXT_PUBLIC_BUNNY_STREAM_API_KEY || "",
          AuthorizationExpire: metadata.expirationTime,
          LibraryId: metadata.libraryId,
          VideoId: bunnyVideoId,
        },
        onError: (error) => {
          console.error("Upload failed:", error);
          setUploadState({
            progress: 0,
            status: "error",
            error: error.message,
          });
          toast.error(`Upload failed: ${error.message}`);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal) * 100;
          setUploadState((prev) => ({
            ...prev,
            progress: percentage,
          }));
        },
        onSuccess: () => {
          setUploadState({
            progress: 100,
            status: "completed",
            videoId,
          });
          toast.success("Upload completed! Your video is now processing");
          onUploadComplete?.();
        },
      });

      uploadRef.current = upload;
      upload.start();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState({
        progress: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed",
      });
      toast.error("Failed to start upload");
    }
  };

  const pauseUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      setUploadState((prev) => ({ ...prev, status: "paused" }));
    }
  };

  const resumeUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.start();
      setUploadState((prev) => ({ ...prev, status: "uploading" }));
    }
  };

  const resetUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
    }
    setFile(null);
    setTitle("");
    setUploadState({ progress: 0, status: "idle" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Select a video file
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: MP4, MOV, AVI, etc.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                disabled={uploadState.status === "uploading"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Video Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploadState.status === "uploading"}
              />
            </div>

            {uploadState.status !== "idle" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {uploadState.status === "uploading" && "Uploading..."}
                    {uploadState.status === "paused" && "Paused"}
                    {uploadState.status === "completed" && "Upload Complete"}
                    {uploadState.status === "error" && "Upload Failed"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(uploadState.progress)}%
                  </span>
                </div>
                <Progress value={uploadState.progress} className="h-2" />
                {uploadState.error && (
                  <p className="text-sm text-red-600">{uploadState.error}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {uploadState.status === "idle" && (
                <Button onClick={startUpload} className="flex-1">
                  Start Upload
                </Button>
              )}

              {uploadState.status === "uploading" && (
                <Button
                  onClick={pauseUpload}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}

              {uploadState.status === "paused" && (
                <Button onClick={resumeUpload} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}

              {(uploadState.status === "completed" ||
                uploadState.status === "error") && (
                <Button onClick={resetUpload} className="flex-1">
                  Upload Another
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
