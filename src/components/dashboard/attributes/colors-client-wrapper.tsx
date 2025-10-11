// src/components/dashboard/attributes/colors-client-wrapper.tsx
"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import ColorsSearch from "./colors-search";
import ColorsTable from "./colors-table";
import ColorFormDialog from "./color-form-dialog";
import { type ColorWithStats } from "@/lib/actions/color-management";

interface ColorsClientWrapperProps {
  initialColors: ColorWithStats[];
}

const ColorsClientWrapper: React.FC<ColorsClientWrapperProps> = ({
  initialColors,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ColorWithStats | null>(null);

  const handleEdit = (color: ColorWithStats) => {
    setEditingColor(color);
    setIsEditDialogOpen(true);
  };

  const handleAddSuccess = () => {
    // Don't call router.refresh() here as it might interfere with pagination
    // The server action will handle revalidation
  };

  const handleEditSuccess = () => {
    setEditingColor(null);
    // Don't call router.refresh() here as it might interfere with pagination
    // The server action will handle revalidation
  };

  const handleAddDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open);
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingColor(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Colors"
        description="Manage color attributes for your cosmetics product variants"
        action={{
          label: "Add Color",
          onClick: () => setIsAddDialogOpen(true),
          icon: <Plus className="h-4 w-4" />,
        }}
      >
        {/* Server-side search component */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ColorsSearch />
        </div>
      </PageHeader>

      {/* Colors Table with server-side data */}
      <ColorsTable 
        colors={initialColors}
        onEdit={handleEdit}
        loading={false}
      />

      {/* Add Color Dialog */}
      <ColorFormDialog
        open={isAddDialogOpen}
        onOpenChange={handleAddDialogChange}
        onSuccess={handleAddSuccess}
        mode="create"
      />

      {/* Edit Color Dialog */}
      <ColorFormDialog
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogChange}
        onSuccess={handleEditSuccess}
        mode="edit"
        initialData={editingColor ?? undefined}
      />
    </>
  );
};

export default ColorsClientWrapper;