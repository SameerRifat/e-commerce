// src/components/dashboard/image-upload.tsx
"use client";

import React, { useCallback, forwardRef, useImperativeHandle } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  Star,
  StarOff,
  GripVertical,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUploadData } from "@/lib/validations/dashboard";
import { VariantData } from "@/lib/validations/product-form";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadThing } from "@/lib/uploadthing";

interface Color {
  id: string;
  name: string;
  hexCode: string;
}

interface Size {
  id: string;
  name: string;
}

interface ImageUploadProps {
  images: ImageUploadData[];
  onChange: (images: ImageUploadData[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  variants?: VariantData[];
  colors?: Color[];
  sizes?: Size[];
}

interface PendingImage extends ImageUploadData {
  file?: File;
  isUploading?: boolean;
  uploadProgress?: number;
}

// Note: UploadingImage interface could be used for upload progress UI
// interface UploadingImage {
//   id: string;
//   file: File;
//   progress: number;
//   preview: string;
// }

export interface ImageUploadRef {
  uploadPendingImages: () => Promise<ImageUploadData[]>;
}

const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(({
  images,
  onChange,
  maxImages = 10,
  className,
  disabled = false,
  variants = [],
  colors = [],
  sizes = [],
}, ref) => {
  // Note: These could be used for future UI enhancements
  // const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  // const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // UploadThing hook for actual file uploads
  const { startUpload, isUploading } = useUploadThing("productImageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Files uploaded successfully:", res);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
    },
  });

  // Expose upload function to parent component
  useImperativeHandle(ref, () => ({
    uploadPendingImages: async () => {
      const imagesToUpload = images.filter((img): img is PendingImage => 
        'file' in img && !!img.file && !img.url.startsWith('http')
      );
      
      if (imagesToUpload.length === 0) {
        return images; // No images to upload
      }

      // Mark images as uploading
      const updatedImages = images.map(img => {
        const pendingImg = img as PendingImage;
        if (pendingImg.file && !pendingImg.url.startsWith('http')) {
          return { ...pendingImg, isUploading: true, uploadProgress: 0 };
        }
        return img;
      });
      onChange(updatedImages);

      try {
        const filesToUpload = imagesToUpload.map(img => (img as PendingImage).file!);
        console.log(`Starting upload of ${filesToUpload.length} files...`);
        
        const uploadResults = await startUpload(filesToUpload);

        if (uploadResults && uploadResults.length > 0) {
          console.log("Upload successful, updating image URLs...", uploadResults);
          
          // Update images with uploaded URLs
          const finalImages = images.map(img => {
            const uploadIndex = imagesToUpload.findIndex(uploadImg => 
              uploadImg.id === img.id
            );
            
            if (uploadIndex !== -1 && uploadResults[uploadIndex]) {
              const uploadedFile = uploadResults[uploadIndex];
              return {
                ...img,
                url: uploadedFile.url,
                file: undefined,
                isUploading: false,
                uploadProgress: 100,
              };
            }
            return img;
          });
          
          onChange(finalImages);
          return finalImages;
        } else {
          throw new Error("Upload failed: No results returned from UploadThing");
        }
      } catch (error) {
        console.error("Upload failed:", error);
        // Mark images as failed
        const failedImages = images.map(img => {
          const pendingImg = img as PendingImage;
          if (pendingImg.file && !pendingImg.url.startsWith('http')) {
            return { ...pendingImg, isUploading: false, uploadProgress: 0 };
          }
          return img;
        });
        onChange(failedImages);
        throw error;
      }

      return images;
    },
  }), [images, onChange, startUpload]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return;

      // Create pending images with file references for deferred upload
      const newImages: PendingImage[] = acceptedFiles.map((file, index) => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file), // Preview URL
        isPrimary: images.length === 0 && index === 0, // First image is primary
        sortOrder: images.length + index,
        variantId: null,
        file: file, // Store file for deferred upload
        isUploading: false,
        uploadProgress: 0,
      }));

      // Add to existing images
      const updatedImages = [...images, ...newImages];
      
      // Ensure at least one image is primary
      if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
        updatedImages[0].isPrimary = true;
      }
      
      // Update sort orders
      const finalImages = updatedImages.map((img, index) => ({
        ...img,
        sortOrder: index,
      }));
      
      onChange(finalImages);
    },
    [disabled, images, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".avif"],
    },
    maxFiles: maxImages - images.length,
    disabled: disabled || images.length >= maxImages,
  });

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    onChange(updatedImages);
  };

  const setPrimary = (id: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onChange(updatedImages);
  };

  const assignToVariant = (imageId: string, variantId: string | null) => {
    const updatedImages = images.map((img) => 
      img.id === imageId ? { ...img, variantId } : img
    );
    onChange(updatedImages);
  };

  const getVariantDisplay = (variantId: string | null) => {
    if (!variantId) return "General Product";
    
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return "Unknown Variant";
    
    const color = colors.find(c => c.id === variant.colorId);
    const size = sizes.find(s => s.id === variant.sizeId);
    
    return `${color?.name || 'Unknown'} - ${size?.name || 'Unknown'}`;
  };

  // Note: reorderImages function could be implemented for drag-and-drop functionality
  // const reorderImages = (dragIndex: number, dropIndex: number) => { ... };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive && "border-blue-500 bg-blue-50",
            disabled && "cursor-not-allowed opacity-50",
            !disabled && "hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Drop the images here...</p>
              ) : (
                <div>
                  <p>Drag & drop images here, or click to select</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: JPEG, PNG, WebP, AVIF (max {maxImages} images)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Note: Uploading images section could be implemented for better UX */}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => {
            const pendingImg = image as PendingImage;
            const isPendingUpload = pendingImg.file && !image.url.startsWith('http');
            const isCurrentlyUploading = pendingImg.isUploading;
            
            return (
              <Card key={image.id} className={cn(
                "overflow-hidden group relative",
                isCurrentlyUploading && "opacity-75"
              )}>
                <CardContent className="p-2">
                  {/* Drag Handle */}
                  {!isCurrentlyUploading && (
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded p-1 cursor-move">
                        <GripVertical className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Primary Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Primary
                      </div>
                    </div>
                  )}

                  {/* Pending Upload Badge */}
                  {/* {isPendingUpload && !isCurrentlyUploading && (
                    <div className="absolute bottom-2 left-2 z-10">
                      <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Pending Upload
                      </div>
                    </div>
                  )} */}

                  <div className="aspect-square relative bg-gray-100 rounded-md overflow-hidden mb-2">
                    {image.url ? (
                      <img
                        src={image.url}
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    {/* Upload Progress Overlay */}
                    {isCurrentlyUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <p className="text-xs">Uploading...</p>
                          {pendingImg.uploadProgress !== undefined && (
                            <Progress value={pendingImg.uploadProgress} className="w-20 h-2 mt-2" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Overlay Actions */}
                    {!isCurrentlyUploading && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPrimary(image.id)}
                          disabled={image.isPrimary}
                        >
                          {image.isPrimary ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-500 text-center">
                    Sort: {image.sortOrder + 1}
                  </div>
                  
                  {variants.length > 0 && (
                    <div className="space-y-1">
                      <Select
                        value={image.variantId || "general"}
                        onValueChange={(value) => assignToVariant(image.id, value === "general" ? null : value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Product</SelectItem>
                          {variants.map((variant) => {
                            if (!variant.id) return null;
                            const color = colors.find(c => c.id === variant.colorId);
                            const size = sizes.find(s => s.id === variant.sizeId);
                            return (
                              <SelectItem key={variant.id} value={variant.id}>
                                <div className="flex items-center gap-2">
                                  {color && (
                                    <div
                                      className="w-3 h-3 rounded border"
                                      style={{ backgroundColor: color.hexCode }}
                                    />
                                  )}
                                  <span>{color?.name} - {size?.name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      
                      <Badge 
                        variant={image.variantId ? "default" : "secondary"}
                        className="text-xs w-full justify-center"
                      >
                        {getVariantDisplay(image.variantId || null)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;