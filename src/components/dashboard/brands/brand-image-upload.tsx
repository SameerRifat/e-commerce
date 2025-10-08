// src/components/dashboard/brands/brand-image-upload.tsx
"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";

interface BrandImageUploadProps {
  logoUrl: string | null;
  onChange: (logoUrl: string | null) => void;
  className?: string;
  disabled?: boolean;
}

const BrandImageUpload: React.FC<BrandImageUploadProps> = ({
  logoUrl,
  onChange,
  className,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoUrl);

  // UploadThing hook for file uploads
  const { startUpload } = useUploadThing("brandLogoUploader", {
    onClientUploadComplete: (res) => {
      console.log("Brand logo uploaded successfully:", res);
      if (res && res[0]) {
        const uploadedUrl = res[0].url;
        setPreviewUrl(uploadedUrl);
        onChange(uploadedUrl);
      }
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error) => {
      console.error("Brand logo upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);
      setUploadProgress(0);

      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      try {
        await startUpload([file]);
      } catch (error) {
        console.error("Upload failed:", error);
        // Revert preview on error
        setPreviewUrl(logoUrl);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [disabled, logoUrl, startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".avif"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const removeLogo = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onChange(null);
  };

  const hasLogo = previewUrl && previewUrl.length > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Brand Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logo Preview */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 relative">
          {hasLogo ? (
            <>
              <img
                src={previewUrl}
                alt="Brand logo preview"
                className="w-full h-full object-contain p-4"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-xs">Uploading...</p>
                    <Progress value={uploadProgress} className="w-20 h-2 mt-2" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "w-full h-full flex flex-col items-center justify-center text-gray-400 cursor-pointer transition-colors",
                isDragActive && "border-blue-500 bg-blue-50 text-blue-600",
                disabled && "cursor-not-allowed opacity-50",
                !disabled && !isDragActive && "hover:border-gray-400 hover:text-gray-500"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-sm text-center">
                {isDragActive ? (
                  "Drop the logo here..."
                ) : (
                  <>
                    <p>No logo uploaded</p>
                    <p className="text-xs mt-1">Add your brand logo</p>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="space-y-2">
          {!hasLogo ? (
            <div
              {...getRootProps()}
              className={cn(
                "w-full",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input {...getInputProps()} />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={disabled || isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Logo"}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div
                {...getRootProps()}
                className={cn(
                  "flex-1",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <input {...getInputProps()} />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={disabled || isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace Logo
                </Button>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={removeLogo}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Recommended: Square image, at least 200x200px, PNG or JPG format
        </p>
      </CardContent>
    </Card>
  );
};

export default BrandImageUpload;
