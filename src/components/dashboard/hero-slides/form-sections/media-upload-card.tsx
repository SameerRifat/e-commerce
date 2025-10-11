// src/components/dashboard/hero-slides/form-sections/media-upload-card.tsx
import React, { RefObject } from "react";
import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { HeroSlideFormData, MediaUploadState } from "../hero-slide-form-schema";
import MediaPreview from "./media-preview";

interface MediaUploadCardProps {
  control: Control<HeroSlideFormData>;
  media: MediaUploadState;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (files: FileList | null) => void;
  onRemove: () => void;
  target: "desktop" | "mobile";
  title: string;
  fieldName: "desktopMediaUrl" | "mobileMediaUrl";
  aspectRatio: string;
  recommendedSize: string;
}

const MediaUploadCard: React.FC<MediaUploadCardProps> = ({
  control,
  media,
  inputRef,
  onFileSelect,
  onRemove,
  target,
  title,
  fieldName,
  aspectRatio,
  recommendedSize,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Input
                      ref={inputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => onFileSelect(e.target.files)}
                      className="max-w-xs"
                    />
                    {(media.preview || media.url) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <FormDescription>
                    Recommended: {recommendedSize}. Max file size: 8MB
                  </FormDescription>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(media.preview || media.url) && (
          <MediaPreview
            src={media.preview || media.url!}
            type={media.type!}
            aspectRatio={aspectRatio}
            target={target}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MediaUploadCard;