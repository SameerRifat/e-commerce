"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import DataTable, { Column, renderDate } from "@/components/dashboard/data-table";
import { deleteColor, type ColorWithStats } from "@/lib/actions/color-management";
import { toast } from "sonner";

interface ColorsTableProps {
  colors: ColorWithStats[];
  onEdit?: (color: ColorWithStats) => void;
  loading?: boolean;
}

const ColorsTable: React.FC<ColorsTableProps> = ({ 
  colors, 
  onEdit,
  loading = false
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<ColorWithStats | null>(null);

  const handleEdit = (color: ColorWithStats) => {
    if (onEdit) {
      onEdit(color);
    }
  };

  const handleDelete = (color: ColorWithStats) => {
    if (color.variantCount > 0) {
      toast.error("Cannot delete color with associated product variants. Please reassign or delete variants first.");
      return;
    }

    setColorToDelete(color);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!colorToDelete) return;

    setIsDeleting(colorToDelete.id);
    try {
      const result = await deleteColor(colorToDelete.id);
      if (result.success) {
        toast.success("Color deleted successfully");
        router.refresh(); // Refresh the server component data
        // Close dialog and reset state after successful deletion
        setDeleteDialogOpen(false);
        setColorToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete color");
        // Keep dialog open on error so user can try again or cancel
      }
    } catch (error) {
      console.error("Error deleting color:", error);
      toast.error("Failed to delete color");
      // Keep dialog open on error so user can try again or cancel
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    if (isDeleting) return; // Prevent canceling during deletion
    setDeleteDialogOpen(false);
    setColorToDelete(null);
  };

  const handleView = (color: ColorWithStats) => {
    if (onEdit) {
      onEdit(color);
    }
  };

  const columns: Column<ColorWithStats>[] = [
    {
      key: "hexCode",
      label: "Color",
      render: (hexCode: string, color: ColorWithStats) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: hexCode }}
            title={hexCode}
          />
          <div>
            <div className="font-medium">{color.name}</div>
            <div className="text-sm text-gray-500 font-mono">{hexCode}</div>
          </div>
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (slug: string) => (
        <span className="text-sm text-gray-600">/{slug}</span>
      ),
    },
    {
      key: "variantCount",
      label: "Used in Variants",
      render: (count: number) => (
        <Badge variant={count > 0 ? "default" : "secondary"}>
          {count}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={colors}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        loading={loading}
        emptyMessage="No colors found. Create your first color to get started."
        isDeleting={(color) => isDeleting === color.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={() => !isDeleting && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Color</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{colorToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelDelete}
              disabled={!!isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={!!isDeleting}
              className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white cursor-pointer ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ColorsTable;
