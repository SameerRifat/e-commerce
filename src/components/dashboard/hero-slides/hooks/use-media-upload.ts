// src/components/dashboard/hero-slides/hooks/use-media-upload.ts
import { useState, RefObject } from "react";
import { UseFormReturn } from "react-hook-form";
import { MediaUploadState, HeroSlideFormData } from "../hero-slide-form-schema";

interface UseMediaUploadProps {
  initialDesktop: { url?: string; type?: "image" | "video" };
  initialMobile: { url?: string; type?: "image" | "video" };
  form: UseFormReturn<HeroSlideFormData>;
  startUpload: (files: File[]) => Promise<Array<{ url: string }> | undefined>;
  desktopInputRef: RefObject<HTMLInputElement | null>;
  mobileInputRef: RefObject<HTMLInputElement | null>;
}

export const useMediaUpload = ({
  initialDesktop,
  initialMobile,
  form,
  startUpload,
  desktopInputRef,
  mobileInputRef,
}: UseMediaUploadProps) => {
  const [desktopMedia, setDesktopMedia] = useState<MediaUploadState>({
    url: initialDesktop.url,
    type: initialDesktop.type,
  });
  const [mobileMedia, setMobileMedia] = useState<MediaUploadState>({
    url: initialMobile.url,
    type: initialMobile.type,
  });

  const handleFileSelect = async (
    files: FileList | null,
    target: "desktop" | "mobile"
  ) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = file.type.startsWith("image/") ? "image" : "video";
    const preview = URL.createObjectURL(file);

    if (target === "desktop") {
      setDesktopMedia({ file, preview, type: fileType });
      form.setValue("desktopMediaType", fileType);
      form.setValue("desktopMediaUrl", preview);
      form.clearErrors("desktopMediaUrl");
    } else {
      setMobileMedia({ file, preview, type: fileType });
      form.setValue("mobileMediaType", fileType);
      form.setValue("mobileMediaUrl", preview);
      form.clearErrors("mobileMediaUrl");
    }
  };

  const uploadMedia = async (): Promise<{
    desktopUrl: string;
    mobileUrl: string;
  }> => {
    const filesToUpload: File[] = [];
    const uploadTargets: ("desktop" | "mobile")[] = [];

    if (desktopMedia.file && !desktopMedia.url) {
      filesToUpload.push(desktopMedia.file);
      uploadTargets.push("desktop");
    }

    if (mobileMedia.file && !mobileMedia.url) {
      filesToUpload.push(mobileMedia.file);
      uploadTargets.push("mobile");
    }

    if (filesToUpload.length === 0) {
      return {
        desktopUrl: desktopMedia.url || form.getValues("desktopMediaUrl"),
        mobileUrl: mobileMedia.url || form.getValues("mobileMediaUrl"),
      };
    }

    const uploadResults = await startUpload(filesToUpload);

    if (!uploadResults || uploadResults.length !== filesToUpload.length) {
      throw new Error("File upload failed");
    }

    let desktopUrl = desktopMedia.url || form.getValues("desktopMediaUrl");
    let mobileUrl = mobileMedia.url || form.getValues("mobileMediaUrl");

    uploadResults.forEach((result, index) => {
      if (uploadTargets[index] === "desktop") {
        desktopUrl = result.url;
      } else {
        mobileUrl = result.url;
      }
    });

    return { desktopUrl, mobileUrl };
  };

  const removeMedia = (target: "desktop" | "mobile") => {
    if (target === "desktop") {
      if (desktopMedia.preview) {
        URL.revokeObjectURL(desktopMedia.preview);
      }
      setDesktopMedia({});
      form.setValue("desktopMediaUrl", "");
      if (desktopInputRef.current) {
        desktopInputRef.current.value = "";
      }
    } else {
      if (mobileMedia.preview) {
        URL.revokeObjectURL(mobileMedia.preview);
      }
      setMobileMedia({});
      form.setValue("mobileMediaUrl", "");
      if (mobileInputRef.current) {
        mobileInputRef.current.value = "";
      }
    }
  };

  return {
    desktopMedia,
    mobileMedia,
    handleFileSelect,
    uploadMedia,
    removeMedia,
  };
};