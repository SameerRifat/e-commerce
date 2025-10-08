// src/components/dashboard/attributes/sizes-client-wrapper.tsx
"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import SizesTable from "./sizes-table";
import SizeFormDialog from "./size-form-dialog";
import { type SizeWithStats } from "@/lib/actions/size-management";
import { type SizeCategoryWithStats } from "@/lib/actions/size-category-management";
// Router removed as we no longer use it for refreshes
import SizesSearch from "./sizes-search";
import SizesCategoryFilter from "./sizes-category-filter";

interface SizesClientWrapperProps {
  initialSizes: SizeWithStats[];
  allCategories: SizeCategoryWithStats[];
  currentCategoryId?: string;
}

const SizesClientWrapper: React.FC<SizesClientWrapperProps> = ({
  initialSizes,
  allCategories,
  currentCategoryId,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<SizeWithStats | null>(null);

  const handleEdit = (size: SizeWithStats) => {
    setEditingSize(size);
    setIsEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    // Don't call router.refresh() here as it might interfere with pagination
    // The server action will handle revalidation
  };

  const handleEditSuccess = () => {
    setEditingSize(null);
    // Don't call router.refresh() here as it might interfere with pagination
    // The server action will handle revalidation
  };

  const handleAddDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open);
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingSize(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Sizes"
        description="Manage size attributes for your cosmetics product variants"
        action={{
          label: "Add Size",
          onClick: () => setIsAddDialogOpen(true),
          icon: <Plus className="h-4 w-4" />,
        }}
      >
        {/* Server-side search and filter components */}
        <div className="flex flex-col sm:flex-row gap-4">
          <SizesSearch />
          <SizesCategoryFilter
            categories={allCategories}
            currentCategoryId={currentCategoryId}
          />
        </div>
      </PageHeader>

      {/* Size Groups Overview removed - using category filter instead for better UX */}

      {/* Sizes Table with server-side data */}
      <SizesTable 
        sizes={initialSizes}
        onEdit={handleEdit}
        loading={false}
      />

      {/* Add Size Dialog */}
      <SizeFormDialog
        open={isAddDialogOpen}
        onOpenChange={handleAddDialogChange}
        onSuccess={handleAddSuccess}
        mode="create"
      />

      {/* Edit Size Dialog */}
      <SizeFormDialog
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogChange}
        onSuccess={handleEditSuccess}
        mode="edit"
        initialData={editingSize ?? undefined}
      />
    </>
  );
};

export default SizesClientWrapper;