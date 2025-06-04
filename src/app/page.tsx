"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Download,
  Eye,
  Calendar,
  FileIcon,
  Video,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TusVideoUploader from "@/components/TusVideoUploader";
import FileUploader from "@/components/FileUploader";
import { toast } from "sonner";
import { DialogTitle } from "@radix-ui/react-dialog";

interface Video {
  _id: string;
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
  uploadedAt: string;
  processedAt?: string;
}

interface File {
  _id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  bunnyUrl?: string;
  fileType: "image" | "document" | "other";
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    }
  };

  const checkVideoStatus = async (videoId: string) => {
    try {
      const response = await fetch(`/api/video/status/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setVideos((prev) =>
          prev.map((video) => (video._id === videoId ? data.video : video))
        );
      }
    } catch (error) {
      console.error("Error checking video status:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchVideos(), fetchFiles()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Poll processing videos every 1 seconds
  useEffect(() => {
    const processingVideos = videos.filter(
      (video) => video.status === "uploading" || video.status === "processing"
    );

    if (processingVideos.length > 0) {
      const interval = setInterval(() => {
        processingVideos.forEach((video) => {
          checkVideoStatus(video._id);
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [videos]);

  const handleUploadComplete = () => {
    fetchVideos();
    fetchFiles();
  };

  const getFileIcon = (file: File) => {
    switch (file.fileType) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploading: { variant: "secondary" as const, text: "Uploading" },
      processing: { variant: "secondary" as const, text: "Processing" },
      ready: { variant: "default" as const, text: "Ready" },
      failed: { variant: "destructive" as const, text: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            File & Video Manager
          </h1>
          <p className="text-xl text-gray-600">
            Upload, manage, and stream your files and videos
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Upload Content
          </h2>
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            <TabsContent value="video" className="mt-6">
              <TusVideoUploader onUploadComplete={handleUploadComplete} />
            </TabsContent>
            <TabsContent value="files" className="mt-6">
              <FileUploader onUploadComplete={handleUploadComplete} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Videos Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Video className="h-6 w-6" />
              Videos ({videos.length})
            </h2>

            {videos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No videos uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <Card key={video._id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {video.title}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {video.originalName}
                          </p>
                        </div>
                        {getStatusBadge(video.status)}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{formatFileSize(video.size)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(video.uploadedAt)}
                        </span>
                      </div>

                      {video.status === "ready" && video.playbackUrl && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedVideo(video)}
                                className="flex-1"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Watch
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogTitle className="sr-only">
                                Watch Video
                              </DialogTitle>
                              <div className="aspect-video">
                                <iframe
                                  src={video.playbackUrl}
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="rounded-lg"
                                ></iframe>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {video.status === "failed" && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                          Video processing failed. Please try uploading again.
                        </div>
                      )}

                      {(video.status === "uploading" ||
                        video.status === "processing") && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-700">
                              {video.status === "uploading"
                                ? "Uploading..."
                                : "Processing video..."}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Files Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileIcon className="h-6 w-6" />
              Files ({files.length})
            </h2>

            {files.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No files uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <Card key={file._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {file.originalName}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {file.mimeType}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {file.fileType}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{formatFileSize(file.size)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(file.uploadedAt)}
                        </span>
                      </div>

                      {file.bunnyUrl && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.bunnyUrl, "_blank")}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = file.bunnyUrl!;
                              link.download = file.originalName;
                              link.click();
                            }}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
