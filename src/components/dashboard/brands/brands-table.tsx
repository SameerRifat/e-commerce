"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DataTable, { Column, renderImage, renderDate } from "@/components/dashboard/data-table";
import { deleteBrand, type BrandWithStats } from "@/lib/actions/brand-management";
import { toast } from "sonner";

interface BrandsTableProps {
  brands: BrandWithStats[];
}

const BrandsTable: React.FC<BrandsTableProps> = ({ brands }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandWithStats | null>(null);

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) =>
      searchTerm === "" ||
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [brands, searchTerm]);

  const handleEdit = (brand: BrandWithStats) => {
    router.push(`/dashboard/brands/${brand.id}/edit`);
  };

  const handleDelete = (brand: BrandWithStats) => {
    if (brand.productCount > 0) {
      toast.error("Cannot delete brand with associated products. Please reassign or delete products first.");
      return;
    }

    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;

    setIsDeleting(brandToDelete.id);
    try {
      const result = await deleteBrand(brandToDelete.id);
      if (result.success) {
        toast.success("Brand deleted successfully");
        router.refresh(); // Refresh the server component data
        // Close dialog and reset state after successful deletion
        setDeleteDialogOpen(false);
        setBrandToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete brand");
        // Keep dialog open on error so user can try again or cancel
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
      // Keep dialog open on error so user can try again or cancel
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    if (isDeleting) return; // Prevent canceling during deletion
    setDeleteDialogOpen(false);
    setBrandToDelete(null);
  };

  const handleView = (brand: BrandWithStats) => {
    // For now, redirect to edit page. Later we can create a view page
    router.push(`/dashboard/brands/${brand.id}/edit`);
  };

  const columns: Column<BrandWithStats>[] = [
    {
      key: "logoUrl",
      label: "Logo",
      render: (logoUrl: string | null, brand: BrandWithStats) => 
        renderImage(logoUrl, brand.name),
      className: "w-16",
    },
    {
      key: "name",
      label: "Brand Name",
      render: (name: string, brand: BrandWithStats) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">/{brand.slug}</div>
        </div>
      ),
    },
    {
      key: "productCount",
      label: "Products",
      render: (count: number) => (
        <Badge variant={count > 0 ? "default" : "secondary"}>
          {count}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: renderDate,
    },
  ];

  return (
    <>
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable
        data={filteredBrands}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        emptyMessage="No brands found. Create your first brand to get started."
        isDeleting={(brand) => isDeleting === brand.id}
      />

      {/* Summary Stats */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {totalBrands}
          </div>
          <div className="text-sm text-gray-600">Total Brands</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {activeBrands}
          </div>
          <div className="text-sm text-gray-600">Active Brands</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {totalProducts}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
      </div> */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={() => !isDeleting && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{brandToDelete?.name}&quot;? This action cannot be undone.
              {brandToDelete?.logoUrl && " The associated logo image will also be deleted."}
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

export default BrandsTable;
