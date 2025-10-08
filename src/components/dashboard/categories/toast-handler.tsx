// src/app/dashboard/categories/components/ToastHandler.tsx
"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ToastHandlerProps {
  success?: string;
}

export default function ToastHandler({ success }: ToastHandlerProps) {
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (success && !hasShownToast.current) {
      hasShownToast.current = true;
      
      // Show appropriate success message
      switch (success) {
        case 'created':
          toast.success('Category created successfully!');
          break;
        case 'updated':
          toast.success('Category updated successfully!');
          break;
        case 'deleted':
          toast.success('Category deleted successfully!');
          break;
        default:
          toast.success('Operation completed successfully!');
      }

      // Clean up the URL by removing the success parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [success, router]);

  // This component doesn't render anything visible
  return null;
}