// src/components/dashboard/collections/collection-image-upload.tsx
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMediaFile } from "@/lib/actions/media-cleanup";
import { isUploadThingUrl } from "@/lib/uploadthing-utils";

interface CollectionImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    startUpload: (files: File[]) => Promise<{ url: string }[] | undefined>;
    aspectRatio: string;
    label: string;
    description: string;
}

const CollectionImageUpload: React.FC<CollectionImageUploadProps> = ({
    value,
    onChange,
    startUpload,
    aspectRatio,
    label,
    description,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const oldImageUrl = preview;

        // Client-side validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            toast.error("Image must be less than 8MB");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setIsUploading(true);
        try {
            const uploadedFiles = await startUpload([file]);
            if (uploadedFiles && uploadedFiles[0]) {
                onChange(uploadedFiles[0].url);
                toast.success("Image uploaded successfully");

                // After successful upload, delete old image from UploadThing (if it exists)
                if (oldImageUrl && isUploadThingUrl(oldImageUrl)) {
                    console.log('[CLEANUP] Deleting replaced collection image:', oldImageUrl);
                    deleteMediaFile(oldImageUrl).catch(error => {
                        console.error('[CLEANUP] Failed to delete old collection image:', error);
                        // Don't block the upload on cleanup failure
                    });
                }
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
            setPreview(value); // Revert preview
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        const urlToDelete = preview;

        // Update UI immediately for better UX
        setPreview("");
        onChange("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }

        // Delete from UploadThing storage if it's an uploaded file
        if (urlToDelete && isUploadThingUrl(urlToDelete)) {
            console.log('[CLEANUP] Deleting removed collection image:', urlToDelete);
            try {
                const result = await deleteMediaFile(urlToDelete);
                if (result.success) {
                    console.log('[CLEANUP] Successfully deleted removed collection image');
                } else {
                    console.error('[CLEANUP] Failed to delete removed collection image:', result.error);
                }
            } catch (error) {
                console.error('[CLEANUP] Error deleting removed collection image:', error);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="max-w-xs"
                />
                {preview && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemove}
                        disabled={isUploading}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                )}
            </div>

            <p className="text-sm text-muted-foreground">{description}</p>

            {isUploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                </div>
            )}

            {preview && !isUploading && (
                <div
                    className="relative w-full max-w-2xl rounded-lg overflow-hidden border bg-gray-100"
                    style={{ aspectRatio }}
                >
                    <img
                        src={preview}
                        alt={label}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
        </div>
    );
};

export default CollectionImageUpload;