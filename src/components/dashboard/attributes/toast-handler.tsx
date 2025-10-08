// src/components/dashboard/attributes/toast-handler.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

interface ToastHandlerProps {
  success?: string;
}

const ToastHandler: React.FC<ToastHandlerProps> = ({ success }) => {
  const pathname = usePathname();

  useEffect(() => {
    if (success === "created") {
      if (pathname.includes("/colors")) {
        toast.success("Color created successfully");
      } else if (pathname.includes("/sizes")) {
        toast.success("Size created successfully");
      } else {
        toast.success("Item created successfully");
      }
    } else if (success === "updated") {
      if (pathname.includes("/colors")) {
        toast.success("Color updated successfully");
      } else if (pathname.includes("/sizes")) {
        toast.success("Size updated successfully");
      } else {
        toast.success("Item updated successfully");
      }
    }
  }, [success, pathname]);

  return null;
};

export default ToastHandler;
