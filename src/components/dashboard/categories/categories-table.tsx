"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Folder, Image as ImageIcon, Loader2 } from "lucide-react";
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
import DataTable, { Column } from "@/components/dashboard/data-table";
import { deleteCategory, type CategoryWithHierarchy } from "@/lib/actions/category-management";
import { toast } from "sonner";

interface CategoriesTableProps {
  categories: CategoryWithHierarchy[];
}

// Display data type for the table
interface CategoryDisplayData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  level: number;
  path: string[];
  childCount: number;
  parentName?: string;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({ categories }) => {
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryDisplayData | null>(null);

  // Transform categories for display
  const displayCategories: CategoryDisplayData[] = categories.map(category => {
    const parent = categories.find(cat => cat.id === category.parentId);
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? null,
      imageUrl: category.imageUrl ?? null,
      level: category.level,
      path: category.path,
      childCount: category.childCount,
      parentName: parent?.name,
    };
  });

  const handleEdit = (category: CategoryDisplayData) => {
    router.push(`/dashboard/categories/${category.id}/edit`);
  };

  const handleDelete = (category: CategoryDisplayData) => {
    if (category.childCount > 0) {
      toast.error("Cannot delete category with subcategories. Please delete or reassign subcategories first.");
      return;
    }

    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(categoryToDelete.id);
    try {
      const result = await deleteCategory(categoryToDelete.id);
      if (result.success) {
        toast.success("Category deleted successfully");
        router.refresh(); // Refresh the server component data
        // Close dialog and reset state after successful deletion
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } else {
        toast.error(result.error || "Failed to delete category");
        // Keep dialog open on error so user can try again or cancel
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
      // Keep dialog open on error so user can try again or cancel
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    if (isDeleting) return; // Prevent canceling during deletion
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleView = (category: CategoryDisplayData) => {
    // For now, redirect to edit page. Later we can create a view page
    router.push(`/dashboard/categories/${category.id}/edit`);
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const columns: Column<CategoryDisplayData>[] = [
    {
      key: "name",
      label: "Category Name",
      render: (name: string, category: CategoryDisplayData) => {
        const indentation = (category.level - 1) * 20; // 20px per level
        return (
          <div className="flex items-center gap-2" style={{ paddingLeft: `${indentation}px` }}>
            {category.childCount > 0 ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
              >
                {expandedCategories.has(category.id) ? (
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                ) : (
                  <Folder className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6 flex-shrink-0" />
            )}

            {/* Category Image */}
            <div className="flex-shrink-0">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{name}</div>
              <div className="text-sm text-gray-500">/{category.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "path",
      label: "Full Path",
      render: (path: string[]) => (
        <div className="text-sm text-gray-600 max-w-xs truncate" title={path.join(" > ")}>
          {path.join(" > ")}
        </div>
      ),
    },
  ];

  // Filter categories based on expansion state for hierarchical display
  const getVisibleCategories = () => {
    const visible: CategoryDisplayData[] = [];

    const addVisibleCategories = (parentId: string | null, level: number = 1) => {
      const categoriesAtLevel = displayCategories.filter(cat =>
        cat.parentId === parentId && cat.level === level
      );

      for (const category of categoriesAtLevel) {
        visible.push(category);

        // If this category is expanded, show its children
        if (expandedCategories.has(category.id) && category.childCount > 0) {
          addVisibleCategories(category.id, level + 1);
        }
      }
    };

    addVisibleCategories(null, 1); // Start with root categories
    return visible;
  };

  const visibleCategories = getVisibleCategories();

  return (
    <>
      <DataTable
        data={visibleCategories}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        emptyMessage="No categories found. Create your first category to organize your products."
        isDeleting={(category) => isDeleting === category.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={() => !isDeleting && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;? This action cannot be undone.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

export default CategoriesTable;