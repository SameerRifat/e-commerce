// src/components/dashboard/video-carousel/video-carousel-items-table.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Card } from "@/components/ui/card";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Plus,
  Loader2,
} from "lucide-react";
import {
  deleteVideoCarouselItem,
  toggleVideoCarouselItemPublish,
  reorderVideoCarouselItems,
  type VideoCarouselItemWithProduct,
} from "@/lib/actions/video-carousel-items";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface VideoCarouselItemsTableProps {
  items: VideoCarouselItemWithProduct[];
}

// Sortable Row Component
const SortableRow: React.FC<{
  item: VideoCarouselItemWithProduct;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  isTogglingPublish: boolean;
}> = ({ item, onEdit, onDelete, onTogglePublish, isTogglingPublish }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Format price for display
  const formatPrice = (price: string | null) => {
    if (!price) return "No price";
    return `Rs.${price}`;
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {/* Drag Handle */}
      <TableCell className="w-8">
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </TableCell>

      {/* Preview Images */}
      <TableCell>
        <div className="flex gap-2">
          {/* Video Preview */}
          <div className="w-16 h-10 relative rounded overflow-hidden bg-gray-100 border">
            <video
              src={item.videoUrl}
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 text-center">
              Video
            </div>
          </div>
          {/* Product Thumbnail (from product_images) */}
          <div className="w-16 h-10 relative rounded overflow-hidden bg-gray-100 border">
            {item.product.primaryImageUrl ? (
              <img
                src={item.product.primaryImageUrl}
                alt={item.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                No image
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 text-center">
              Thumbnail
            </div>
          </div>
        </div>
      </TableCell>

      {/* Product Name (from products table) */}
      <TableCell>
        <div>
          <div className="font-medium">
            {item.product.name || <span className="text-gray-400 italic">Untitled</span>}
          </div>
          <div className="text-xs text-gray-500">
            Product ID: {item.product.id.substring(0, 8)}...
          </div>
        </div>
      </TableCell>

      {/* Price (from products table) */}
      <TableCell>
        <span className="font-medium">{formatPrice(item.product.price)}</span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={item.isPublished ? "default" : "secondary"}>
          {item.isPublished ? "Published" : "Draft"}
        </Badge>
      </TableCell>

      {/* Sort Order */}
      <TableCell className="text-center">{item.sortOrder}</TableCell>

      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isTogglingPublish}>
              {isTogglingPublish ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} disabled={isTogglingPublish}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTogglePublish} disabled={isTogglingPublish}>
              {isTogglingPublish ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : item.isPublished ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600"
              disabled={isTogglingPublish}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

const VideoCarouselItemsTable: React.FC<VideoCarouselItemsTableProps> = ({ items: initialItems }) => {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end (keeping optimistic update for drag-and-drop)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);

    // Update local state immediately for smooth UX (visual feedback is crucial for drag-and-drop)
    setItems(newItems);

    // Update sort orders
    const itemOrders = newItems.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    // Persist to database
    const result = await reorderVideoCarouselItems(itemOrders);

    if (result.success) {
      toast.success("Item order updated");
      router.refresh();
    } else {
      toast.error("Failed to update item order");
      setItems(initialItems); // Revert on error
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    const result = await deleteVideoCarouselItem(itemToDelete);

    if (result.success) {
      toast.success("Item deleted successfully");

      // Update local state immediately to remove the deleted item
      setItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemToDelete)
      );

      // Close dialog after successful deletion
      setDeleteDialogOpen(false);
      setItemToDelete(null);

      // Refresh to sync with server
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete item");
    }

    setIsDeleting(false);
  };

  // Handle toggle publish
  const handleTogglePublish = async (itemId: string, currentStatus: boolean) => {
    // Set loading state
    setTogglingItemId(itemId);

    // Perform the server action
    const newStatus = !currentStatus;
    const result = await toggleVideoCarouselItemPublish(itemId, newStatus);

    if (result.success) {
      toast.success(newStatus ? "Item published" : "Item unpublished");
      // Refresh to get the updated state from server
      router.refresh();

      // Update local state immediately after refresh is triggered
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, isPublished: newStatus }
            : item
        )
      );
    } else {
      toast.error(result.error || "Failed to update item status");
    }

    // Clear loading state
    setTogglingItemId(null);
  };

  if (items.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium mb-1">No Video Carousel Items</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by creating your first video carousel item
            </p>
            <Button onClick={() => router.push("/dashboard/video-carousel/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={items.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onEdit={() => router.push(`/dashboard/video-carousel/${item.id}/edit`)}
                    onDelete={() => {
                      setItemToDelete(item.id);
                      setDeleteDialogOpen(true);
                    }}
                    onTogglePublish={() =>
                      handleTogglePublish(item.id, item.isPublished)
                    }
                    isTogglingPublish={togglingItemId === item.id}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video Carousel Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

export default VideoCarouselItemsTable;
