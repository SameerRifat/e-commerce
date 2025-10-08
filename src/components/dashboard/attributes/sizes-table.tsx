// src/components/dashboard/attributes/sizes-table.tsx
"use client";

import React, { useState } from "react";
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
import DataTable, { Column } from "@/components/dashboard/data-table";
import { deleteSize, type SizeWithStats } from "@/lib/actions/size-management";
import { toast } from "sonner";

interface SizesTableProps {
  sizes: SizeWithStats[];
  onEdit?: (size: SizeWithStats) => void;
  loading?: boolean;
}

const SizesTable: React.FC<SizesTableProps> = ({ 
  sizes, 
  onEdit,
  loading = false
}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<SizeWithStats | null>(null);

  const handleEdit = (size: SizeWithStats) => {
    if (onEdit) {
      onEdit(size);
    }
  };

  const handleDelete = (size: SizeWithStats) => {
    if (size.variantCount > 0) {
      toast.error("Cannot delete size with associated product variants. Please reassign or delete variants first.");
      return;
    }

    setSizeToDelete(size);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sizeToDelete) return;

    setIsDeleting(sizeToDelete.id);
    try {
      const result = await deleteSize(sizeToDelete.id);
      if (result.success) {
        toast.success("Size deleted successfully");
        // Close dialog and reset state after successful deletion
        setDeleteDialogOpen(false);
        setSizeToDelete(null);
        // The server action will handle revalidation, no need for router.refresh()
      } else {
        toast.error(result.error || "Failed to delete size");
        // Keep dialog open on error so user can try again or cancel
      }
    } catch (error) {
      console.error("Error deleting size:", error);
      toast.error("Failed to delete size");
      // Keep dialog open on error so user can try again or cancel
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    if (isDeleting) return; // Prevent canceling during deletion
    setDeleteDialogOpen(false);
    setSizeToDelete(null);
  };

  const handleView = (size: SizeWithStats) => {
    if (onEdit) {
      onEdit(size);
    }
  };

  const columns: Column<SizeWithStats>[] = [
    {
      key: "sortOrder",
      label: "Order",
      render: (sortOrder: number) => (
        <Badge variant="outline" className="font-mono">
          {sortOrder}
        </Badge>
      ),
      className: "w-20",
    },
    {
      key: "name",
      label: "Size Name",
      render: (name: string, size: SizeWithStats) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">/{size.slug}</div>
        </div>
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
        data={sizes}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        loading={loading}
        emptyMessage="No sizes found. Create your first size to get started."
        isDeleting={(size) => isDeleting === size.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={() => !isDeleting && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Size</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{sizeToDelete?.name}&quot;? This action cannot be undone.
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

export default SizesTable;
