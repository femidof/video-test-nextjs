"use client";

import { useState, useRef } from "react";
import { Upload, X, File, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface FileUploadState {
  progress: number;
  status: "idle" | "uploading" | "completed" | "error";
  error?: string;
}

export default function FileUploader({
  onUploadComplete,
}: {
  onUploadComplete?: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStates, setUploadStates] = useState<{
    [key: string]: FileUploadState;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text")
    ) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      // Filter out video files (those should use the video uploader)
      const nonVideoFiles = selectedFiles.filter(
        (file) => !file.type.startsWith("video/")
      );

      if (nonVideoFiles.length !== selectedFiles.length) {
        toast.error("Please use the video uploader for video files");
      }

      setFiles((prev) => [...prev, ...nonVideoFiles]);

      // Initialize upload states
      const newStates: { [key: string]: FileUploadState } = {};
      nonVideoFiles.forEach((file) => {
        const key = `${file.name}-${file.size}`;
        newStates[key] = { progress: 0, status: "idle" };
      });
      setUploadStates((prev) => ({ ...prev, ...newStates }));
    }
  };

  const uploadFile = async (file: File) => {
    const fileKey = `${file.name}-${file.size}`;

    try {
      setUploadStates((prev) => ({
        ...prev,
        [fileKey]: { progress: 0, status: "uploading" },
      }));

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadStates((prev) => ({
            ...prev,
            [fileKey]: { ...prev[fileKey], progress },
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadStates((prev) => ({
            ...prev,
            [fileKey]: { progress: 100, status: "completed" },
          }));
          toast.success(`${file.name} uploaded successfully`);
          onUploadComplete?.();
        } else {
          throw new Error("Upload failed");
        }
      };

      xhr.onerror = () => {
        throw new Error("Upload failed");
      };

      xhr.open("POST", "/api/upload/file");
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStates((prev) => ({
        ...prev,
        [fileKey]: {
          progress: 0,
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        },
      }));
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((file) => {
      const fileKey = `${file.name}-${file.size}`;
      return uploadStates[fileKey]?.status === "idle";
    });

    if (pendingFiles.length === 0) {
      toast.error("All files have already been uploaded");
      return;
    }

    // Upload files in parallel
    await Promise.all(pendingFiles.map((file) => uploadFile(file)));
  };

  const removeFile = (fileToRemove: File) => {
    const fileKey = `${fileToRemove.name}-${fileToRemove.size}`;
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    setUploadStates((prev) => {
      const newStates = { ...prev };
      delete newStates[fileKey];
      return newStates;
    });
  };

  const clearAll = () => {
    setFiles([]);
    setUploadStates({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Select files to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Images, documents, and other files (excluding videos)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              Choose Files
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add More
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => {
                const fileKey = `${file.name}-${file.size}`;
                const uploadState = uploadStates[fileKey];

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        {uploadState && uploadState.status !== "idle" && (
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="capitalize">
                                {uploadState.status}
                              </span>
                              <span>{Math.round(uploadState.progress)}%</span>
                            </div>
                            <Progress
                              value={uploadState.progress}
                              className="h-1 mt-1"
                            />
                            {uploadState.error && (
                              <p className="text-xs text-red-600 mt-1">
                                {uploadState.error}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      disabled={uploadState?.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <Button onClick={uploadAllFiles} className="w-full">
              Upload All Files
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
