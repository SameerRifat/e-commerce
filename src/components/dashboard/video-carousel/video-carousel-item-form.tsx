// src/components/dashboard/video-carousel/video-carousel-item-form.tsx
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Video, X } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import {
  createVideoCarouselItem,
  updateVideoCarouselItem,
  type VideoCarouselItemWithProduct
} from "@/lib/actions/video-carousel-items";
import { InsertVideoCarouselItem } from "@/lib/db/schema/video-carousel-items";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/dashboard/page-header";
import {
  videoCarouselItemFormSchema,
  VideoCarouselItemFormData,
  MediaUploadState
} from "./video-carousel-item-form-schema";
import { deleteMediaFile } from "@/lib/actions/media-cleanup";
import { isUploadThingUrl } from "@/lib/uploadthing-utils";
import { searchProducts, getProductById } from "@/lib/actions/admin-search";
import { SearchableCombobox } from "@/components/dashboard/hero-slides/searchable-combobox";

interface VideoCarouselItemFormProps {
  mode: "create" | "edit";
  initialData?: VideoCarouselItemWithProduct;
}

const VideoCarouselItemForm: React.FC<VideoCarouselItemFormProps> = ({
  mode,
  initialData,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const [videoMedia, setVideoMedia] = useState<MediaUploadState>({
    url: initialData?.videoUrl,
    type: "video",
  });

  const { startUpload, isUploading } = useUploadThing("videoCarouselUploader", {
    onClientUploadComplete: (res) => {
      console.log("Upload complete:", res);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    },
  });

  const form = useForm<VideoCarouselItemFormData>({
    resolver: zodResolver(videoCarouselItemFormSchema),
    mode: "onSubmit",
    defaultValues: {
      isPublished: initialData?.isPublished || false,
      linkedProductId: initialData?.linkedProductId || "",
      videoUrl: initialData?.videoUrl || "",
    },
  });

  const handleVideoSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const preview = URL.createObjectURL(file);

    setVideoMedia({ file, preview, type: "video" });
    form.setValue("videoUrl", preview);
    form.clearErrors("videoUrl");
  };

  const removeVideo = async () => {
    const urlToDelete = videoMedia.url;

    // Revoke blob preview if it exists
    if (videoMedia.preview) {
      URL.revokeObjectURL(videoMedia.preview);
    }

    // Update UI immediately
    setVideoMedia({});
    form.setValue("videoUrl", "");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }

    // Delete from UploadThing storage if it's an uploaded file
    if (urlToDelete && isUploadThingUrl(urlToDelete)) {
      console.log('[CLEANUP] Deleting removed video carousel video:', urlToDelete);
      deleteMediaFile(urlToDelete).catch(error => {
        console.error('[CLEANUP] Failed to delete video carousel video:', error);
      });
    }
  };

  const uploadMediaFiles = async (): Promise<{ videoUrl: string }> => {
    // If there's a file to upload
    if (videoMedia.file && !videoMedia.url) {
      const uploadResults = await startUpload([videoMedia.file]);

      if (!uploadResults || uploadResults.length === 0) {
        throw new Error("Video upload failed");
      }

      return { videoUrl: uploadResults[0].url };
    }

    // Otherwise, use existing URL
    return {
      videoUrl: videoMedia.url || form.getValues("videoUrl"),
    };
  };

  const onSubmit = async (data: VideoCarouselItemFormData) => {
    setIsSubmitting(true);

    try {
      const { videoUrl } = await uploadMediaFiles();

      const itemData: Partial<InsertVideoCarouselItem> = {
        isPublished: data.isPublished,
        videoUrl: videoUrl,
        linkedProductId: data.linkedProductId,
      };

      let result;
      if (mode === "create") {
        result = await createVideoCarouselItem(itemData as InsertVideoCarouselItem);
      } else {
        result = await updateVideoCarouselItem(initialData!.id, itemData);
      }

      if (result.success) {
        toast.success(
          mode === "create" ? "Video carousel item created" : "Video carousel item updated"
        );
        router.push("/dashboard/video-carousel");
      } else {
        toast.error(result.error || "Failed to save video carousel item");

        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof VideoCarouselItemFormData, {
              type: "server",
              message: errors.join(", "),
            });
          });
        }
      }
    } catch (error) {
      console.error("Error saving video carousel item:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Create Video Carousel Item" : "Edit Video Carousel Item"}
        description="Upload a product video for the homepage carousel"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/video-carousel")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Video Carousel
          </Button>
        </div>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Product</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="linkedProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <FormControl>
                      <SearchableCombobox
                        value={field.value || undefined}
                        onValueChange={(value) => field.onChange(value)}
                        placeholder="Search and select a product..."
                        searchPlaceholder="Search products by name or SKU..."
                        emptyMessage="No products found."
                        onSearch={async (query, offset) => {
                          const result = await searchProducts(query, 20, offset);
                          return {
                            data: result.data.map((p) => ({
                              id: p.id,
                              name: p.name,
                              meta: p.sku || undefined,
                            })),
                            hasMore: result.hasMore,
                          };
                        }}
                        onGetById={async (id) => {
                          const product = await getProductById(id);
                          if (!product) return null;
                          return {
                            id: product.id,
                            name: product.name,
                            meta: product.sku || undefined,
                          };
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Product name, price, and thumbnail will be automatically fetched from the selected product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Video Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Video Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a product video (MP4 recommended, max 64MB)
                </p>

                {!videoMedia.preview && !videoMedia.url ? (
                  <div className="space-y-2">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => handleVideoSelect(e.target.files)}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">Click to upload video</p>
                        <p className="text-xs text-muted-foreground">MP4 or WebM (max 64MB)</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border max-w-md mx-auto">
                      <video
                        src={videoMedia.preview || videoMedia.url}
                        controls
                        className="w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeVideo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {videoMedia.file ? `Selected: ${videoMedia.file.name}` : "Current video"}
                    </p>
                  </div>
                )}

                {form.formState.errors.videoUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.videoUrl.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publish Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish Item</FormLabel>
                      <FormDescription>
                        Make this item visible in the homepage video carousel
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/video-carousel")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Item" : "Update Item"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default VideoCarouselItemForm;
