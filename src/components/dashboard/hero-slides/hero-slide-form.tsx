// src/components/dashboard/hero-slides/hero-slide-form.tsx
"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { createHeroSlide, updateHeroSlide } from "@/lib/actions/hero-slides";
import { InsertHeroSlide, SelectHeroSlide } from "@/lib/db/schema/hero-slides";
import PageHeader from "@/components/dashboard/page-header";
import { heroSlideFormSchema, HeroSlideFormData } from "./hero-slide-form-schema";
import { useMediaUpload } from "./hooks/use-media-upload";
import { useLinkTypeEffect } from "./hooks/use-link-type-effect";
import BasicInformationCard from "./form-sections/basic-information-card";
import MediaUploadCard from "./form-sections/media-upload-card";
import LinkConfigurationCard from "./form-sections/link-configuration-card";

interface HeroSlideFormProps {
  mode: "create" | "edit";
  initialData?: SelectHeroSlide;
}

/**
 * OPTIMIZED: Form no longer requires products/collections props
 * Data is fetched on-demand via server actions in the combobox
 */
const HeroSlideForm: React.FC<HeroSlideFormProps> = ({
  mode,
  initialData,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("heroSlideUploader", {
    onClientUploadComplete: (res) => {
      console.log("Upload complete:", res);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    },
  });

  const form = useForm<HeroSlideFormData>({
    resolver: zodResolver(heroSlideFormSchema),
    mode: "onSubmit",
    defaultValues: {
      title: initialData?.title || "",
      altText: initialData?.altText || "",
      description: initialData?.description || "",
      isPublished: initialData?.isPublished || false,
      linkType: initialData?.linkType || "none",
      linkedProductId: initialData?.linkedProductId || null,
      linkedCollectionId: initialData?.linkedCollectionId || null,
      externalUrl: initialData?.externalUrl || "",
      desktopMediaUrl: initialData?.desktopMediaUrl || "",
      desktopMediaType: initialData?.desktopMediaType || "image",
      mobileMediaUrl: initialData?.mobileMediaUrl || "",
      mobileMediaType: initialData?.mobileMediaType || "image",
    },
  });

  const {
    desktopMedia,
    mobileMedia,
    handleFileSelect,
    removeMedia,
    uploadMedia,
  } = useMediaUpload({
    initialDesktop: {
      url: initialData?.desktopMediaUrl,
      type: initialData?.desktopMediaType,
    },
    initialMobile: {
      url: initialData?.mobileMediaUrl,
      type: initialData?.mobileMediaType,
    },
    form,
    startUpload,
    desktopInputRef,
    mobileInputRef,
  });

  const linkType = form.watch("linkType");
  useLinkTypeEffect(linkType, form);

  const onSubmit = async (data: HeroSlideFormData) => {
    setIsSubmitting(true);

    try {
      const { desktopUrl, mobileUrl } = await uploadMedia();

      const slideData: Partial<InsertHeroSlide> = {
        ...data,
        desktopMediaUrl: desktopUrl,
        mobileMediaUrl: mobileUrl,
        externalUrl: data.externalUrl || null,
        linkedProductId: data.linkType === "product" ? data.linkedProductId : null,
        linkedCollectionId: data.linkType === "collection" ? data.linkedCollectionId : null,
      };

      let result;
      if (mode === "create") {
        result = await createHeroSlide(slideData as InsertHeroSlide);
      } else {
        result = await updateHeroSlide(initialData!.id, slideData);
      }

      if (result.success) {
        toast.success(
          mode === "create" ? "Hero slide created" : "Hero slide updated"
        );
        router.push("/dashboard/hero-slides");
      } else {
        toast.error(result.error || "Failed to save hero slide");

        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof HeroSlideFormData, {
              type: "server",
              message: errors.join(", "),
            });
          });
        }
      }
    } catch (error) {
      console.error("Error saving hero slide:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Create Hero Slide" : "Edit Hero Slide"}
        description="Configure homepage carousel slide settings"
      >
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/dashboard/hero-slides")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hero Slides
          </Button>
        </div>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <BasicInformationCard control={form.control} />

          <MediaUploadCard
            control={form.control}
            media={desktopMedia}
            inputRef={desktopInputRef}
            onFileSelect={(files) => handleFileSelect(files, "desktop")}
            onRemove={() => removeMedia("desktop")}
            target="desktop"
            title="Desktop Media (16:6 Ratio Recommended)"
            fieldName="desktopMediaUrl"
            aspectRatio="16/6"
            recommendedSize="2400×900px or 16:6 aspect ratio"
          />

          <MediaUploadCard
            control={form.control}
            media={mobileMedia}
            inputRef={mobileInputRef}
            onFileSelect={(files) => handleFileSelect(files, "mobile")}
            onRemove={() => removeMedia("mobile")}
            target="mobile"
            title="Mobile Media (3:4 Ratio Recommended)"
            fieldName="mobileMediaUrl"
            aspectRatio="3/4"
            recommendedSize="1000×1333px or 3:4 aspect ratio"
          />

          <LinkConfigurationCard
            control={form.control}
            linkType={linkType}
          />

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/hero-slides")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Slide" : "Update Slide"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default HeroSlideForm;