"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Grid, List, Upload, Download, Trash2 } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Mock data for media files
interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number; // in bytes
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
  usedInProducts: string[];
}

const mockMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "lipstick-ruby-red-main.jpg",
    url: "/static/uploads/cosmetics/lipstick-1.jpg",
    size: 245760, // 240KB
    type: "image/jpeg",
    dimensions: { width: 800, height: 800 },
    uploadedAt: new Date("2024-01-15"),
    usedInProducts: ["1"],
  },
  {
    id: "2",
    name: "lipstick-coral-pink-variant.jpg",
    url: "/static/uploads/cosmetics/lipstick-2.jpg",
    size: 198432, // 194KB
    type: "image/jpeg",
    dimensions: { width: 600, height: 600 },
    uploadedAt: new Date("2024-01-16"),
    usedInProducts: ["1"],
  },
  {
    id: "3",
    name: "serum-bottle-clear.png",
    url: "/static/uploads/cosmetics/serum-1.jpg",
    size: 512000, // 500KB
    type: "image/png",
    dimensions: { width: 1000, height: 1000 },
    uploadedAt: new Date("2024-01-18"),
    usedInProducts: ["2"],
  },
  {
    id: "4",
    name: "eyeshadow-palette-sunset.jpg",
    url: "/static/uploads/cosmetics/eyeshadow-1.jpg",
    size: 389120, // 380KB
    type: "image/jpeg",
    dimensions: { width: 800, height: 600 },
    uploadedAt: new Date("2024-01-20"),
    usedInProducts: ["3"],
  },
  {
    id: "5",
    name: "foundation-nude-beige.avif",
    url: "/static/uploads/cosmetics/foundation-1.avif",
    size: 156672, // 153KB
    type: "image/avif",
    dimensions: { width: 600, height: 800 },
    uploadedAt: new Date("2024-01-22"),
    usedInProducts: [],
  },
  {
    id: "6",
    name: "mascara-black-tube.webp",
    url: "/static/uploads/cosmetics/mascara-1.webp",
    size: 87040, // 85KB
    type: "image/webp",
    dimensions: { width: 400, height: 600 },
    uploadedAt: new Date("2024-01-25"),
    usedInProducts: [],
  },
];

const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const MediaPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<string>("all");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Filter media files
  const filteredFiles = useMemo(() => {
    return mockMediaFiles.filter((file) => {
      const matchesSearch =
        searchTerm === "" ||
        file.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        file.type.startsWith(typeFilter);

      const matchesUsage =
        usageFilter === "all" ||
        (usageFilter === "used" && file.usedInProducts.length > 0) ||
        (usageFilter === "unused" && file.usedInProducts.length === 0);

      return matchesSearch && matchesType && matchesUsage;
    });
  }, [searchTerm, typeFilter, usageFilter]);

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(file => file.id)));
    }
  };

  const deleteSelectedFiles = () => {
    console.log("Delete files:", Array.from(selectedFiles));
    setSelectedFiles(new Set());
  };

  const totalSize = filteredFiles.reduce((sum, file) => sum + file.size, 0);
  const usedFiles = filteredFiles.filter(file => file.usedInProducts.length > 0).length;
  const unusedFiles = filteredFiles.filter(file => file.usedInProducts.length === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Manage your product images and media files"
        action={{
          label: "Upload Images",
          onClick: () => router.push("/dashboard/media/upload"),
          icon: <Upload className="h-4 w-4" />,
        }}
      >
        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search media files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={usageFilter} onValueChange={setUsageFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-900">
              {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="destructive" onClick={deleteSelectedFiles}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </PageHeader>

      {/* File Display */}
      <div className="space-y-4">
        {/* Select All */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
            onCheckedChange={selectAllFiles}
          />
          <span className="text-sm text-gray-600">
            Select all ({filteredFiles.length} files)
          </span>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="group relative overflow-hidden">
                <CardContent className="p-0">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                      className="bg-white shadow-sm"
                    />
                  </div>

                  {/* Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* File Info */}
                  <div className="p-2">
                    <div className="text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatFileSize(file.size)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {file.usedInProducts.length > 0 ? (
                        <Badge variant="default" className="text-xs">
                          Used
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Unused
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                    />
                    
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                        {file.dimensions && (
                          <> • {file.dimensions.width}×{file.dimensions.height}</>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Uploaded {file.uploadedAt.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {file.usedInProducts.length > 0 ? (
                        <Badge variant="default">
                          Used in {file.usedInProducts.length} product{file.usedInProducts.length > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unused</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media files found</h3>
            <p className="text-gray-500">Upload your first images to get started.</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard/media/upload")}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {filteredFiles.length}
          </div>
          <div className="text-sm text-gray-600">Total Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {usedFiles}
          </div>
          <div className="text-sm text-gray-600">Used Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {unusedFiles}
          </div>
          <div className="text-sm text-gray-600">Unused Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatFileSize(totalSize)}
          </div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
      </div>
    </div>
  );
};

export default MediaPage;
