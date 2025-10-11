// src/components/dashboard/hero-slides/hero-slides-table.tsx
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
  ExternalLink,
  Package,
  Layers,
  Plus,
  Loader2,
} from "lucide-react";
import {
  deleteHeroSlide,
  toggleHeroSlidePublish,
  reorderHeroSlides,
} from "@/lib/actions/hero-slides";
import { SelectHeroSlide } from "@/lib/db/schema/hero-slides";
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

interface HeroSlidesTableProps {
  slides: SelectHeroSlide[];
}

// Sortable Row Component
const SortableRow: React.FC<{
  slide: SelectHeroSlide;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  isTogglingPublish: boolean;
}> = ({ slide, onEdit, onDelete, onTogglePublish, isTogglingPublish }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getLinkIcon = () => {
    switch (slide.linkType) {
      case "product":
        return <Package className="h-3 w-3" />;
      case "collection":
        return <Layers className="h-3 w-3" />;
      case "external":
        return <ExternalLink className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getLinkLabel = () => {
    switch (slide.linkType) {
      case "product":
        return "Product";
      case "collection":
        return "Collection";
      case "external":
        return "External";
      case "none":
        return "None";
      default:
        return slide.linkType;
    }
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
          <div className="w-16 h-10 relative rounded overflow-hidden bg-gray-100 border">
            {slide.desktopMediaType === "image" ? (
              <img
                src={slide.desktopMediaUrl}
                alt={slide.altText || "Desktop preview"}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={slide.desktopMediaUrl}
                className="w-full h-full object-cover"
                muted
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 text-center">
              Desktop
            </div>
          </div>
          <div className="w-12 h-10 relative rounded overflow-hidden bg-gray-100 border">
            {slide.mobileMediaType === "image" ? (
              <img
                src={slide.mobileMediaUrl}
                alt={slide.altText || "Mobile preview"}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={slide.mobileMediaUrl}
                className="w-full h-full object-cover"
                muted
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 text-center">
              Mobile
            </div>
          </div>
        </div>
      </TableCell>

      {/* Title */}
      <TableCell>
        <div>
          <div className="font-medium">
            {slide.title || <span className="text-gray-400 italic">Untitled</span>}
          </div>
          {slide.altText && (
            <div className="text-xs text-gray-500 truncate max-w-xs">
              {slide.altText}
            </div>
          )}
        </div>
      </TableCell>

      {/* Link Type */}
      <TableCell>
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          {getLinkIcon()}
          {getLinkLabel()}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge variant={slide.isPublished ? "default" : "secondary"}>
          {slide.isPublished ? "Published" : "Draft"}
        </Badge>
      </TableCell>

      {/* Sort Order */}
      <TableCell className="text-center">{slide.sortOrder}</TableCell>

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
              ) : slide.isPublished ? (
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

const HeroSlidesTable: React.FC<HeroSlidesTableProps> = ({ slides: initialSlides }) => {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingSlideId, setTogglingSlideId] = useState<string | null>(null);

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

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);

    const newSlides = arrayMove(slides, oldIndex, newIndex);

    // Update local state immediately for smooth UX (visual feedback is crucial for drag-and-drop)
    setSlides(newSlides);

    // Update sort orders
    const slideOrders = newSlides.map((slide, index) => ({
      id: slide.id,
      sortOrder: index,
    }));

    // Persist to database
    const result = await reorderHeroSlides(slideOrders);

    if (result.success) {
      toast.success("Slide order updated");
      router.refresh();
    } else {
      toast.error("Failed to update slide order");
      setSlides(initialSlides); // Revert on error
    }
  };

  // Handle delete - FIXED VERSION
  const handleDelete = async () => {
    if (!slideToDelete) return;

    setIsDeleting(true);
    const result = await deleteHeroSlide(slideToDelete);

    if (result.success) {
      toast.success("Slide deleted successfully");
      
      // Update local state immediately to remove the deleted slide
      setSlides((prevSlides) => 
        prevSlides.filter((slide) => slide.id !== slideToDelete)
      );
      
      // Close dialog after successful deletion
      setDeleteDialogOpen(false);
      setSlideToDelete(null);
      
      // Refresh to sync with server
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete slide");
    }

    setIsDeleting(false);
  };

  // Handle toggle publish with loading-only approach (NO optimistic update)
  const handleTogglePublish = async (slideId: string, currentStatus: boolean) => {
    // Set loading state
    setTogglingSlideId(slideId);

    // Perform the server action (no UI update before this)
    const newStatus = !currentStatus;
    const result = await toggleHeroSlidePublish(slideId, newStatus);

    if (result.success) {
      toast.success(newStatus ? "Slide published" : "Slide unpublished");
      // Refresh to get the updated state from server
      router.refresh();

      // Update local state immediately after refresh is triggered
      // This ensures UI updates even before router.refresh() completes
      setSlides((prevSlides) =>
        prevSlides.map((slide) =>
          slide.id === slideId
            ? { ...slide, isPublished: newStatus }
            : slide
        )
      );
    } else {
      toast.error(result.error || "Failed to update slide status");
    }

    // Clear loading state
    setTogglingSlideId(null);
  };

  if (slides.length === 0) {
    return (
      <Card className="text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-1">No Hero Slides</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by creating your first hero slide
            </p>
            <Button onClick={() => router.push("/dashboard/hero-slides/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Slide
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
                <TableHead>Title</TableHead>
                <TableHead>Link Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={slides.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {slides.map((slide) => (
                  <SortableRow
                    key={slide.id}
                    slide={slide}
                    onEdit={() => router.push(`/dashboard/hero-slides/${slide.id}/edit`)}
                    onDelete={() => {
                      setSlideToDelete(slide.id);
                      setDeleteDialogOpen(true);
                    }}
                    onTogglePublish={() =>
                      handleTogglePublish(slide.id, slide.isPublished)
                    }
                    isTogglingPublish={togglingSlideId === slide.id}
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
            <AlertDialogTitle>Delete Hero Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this slide? This action cannot be undone.
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

export default HeroSlidesTable;

// // src/components/dashboard/hero-slides/hero-slides-table.tsx
// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Card } from "@/components/ui/card";
// import {
//   MoreHorizontal,
//   Edit,
//   Trash2,
//   Eye,
//   EyeOff,
//   GripVertical,
//   ExternalLink,
//   Package,
//   Layers,
//   Plus,
//   Loader2,
// } from "lucide-react";
// import {
//   deleteHeroSlide,
//   toggleHeroSlidePublish,
//   reorderHeroSlides,
// } from "@/lib/actions/hero-slides";
// import { SelectHeroSlide } from "@/lib/db/schema/hero-slides";
// import { toast } from "sonner";
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";

// interface HeroSlidesTableProps {
//   slides: SelectHeroSlide[];
// }

// // Sortable Row Component
// const SortableRow: React.FC<{
//   slide: SelectHeroSlide;
//   onEdit: () => void;
//   onDelete: () => void;
//   onTogglePublish: () => void;
//   isTogglingPublish: boolean;
// }> = ({ slide, onEdit, onDelete, onTogglePublish, isTogglingPublish }) => {
//   const {
//     attributes,
//     listeners,
//     setNodeRef,
//     transform,
//     transition,
//     isDragging,
//   } = useSortable({ id: slide.id });

//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     opacity: isDragging ? 0.5 : 1,
//   };

//   const getLinkIcon = () => {
//     switch (slide.linkType) {
//       case "product":
//         return <Package className="h-3 w-3" />;
//       case "collection":
//         return <Layers className="h-3 w-3" />;
//       case "external":
//         return <ExternalLink className="h-3 w-3" />;
//       default:
//         return null;
//     }
//   };

//   const getLinkLabel = () => {
//     switch (slide.linkType) {
//       case "product":
//         return "Product";
//       case "collection":
//         return "Collection";
//       case "external":
//         return "External";
//       case "none":
//         return "None";
//       default:
//         return slide.linkType;
//     }
//   };

//   return (
//     <TableRow ref={setNodeRef} style={style}>
//       {/* Drag Handle */}
//       <TableCell className="w-8">
//         <div {...attributes} {...listeners} className="cursor-move">
//           <GripVertical className="h-4 w-4 text-gray-400" />
//         </div>
//       </TableCell>

//       {/* Preview Images */}
//       <TableCell>
//         <div className="flex gap-2">
//           <div className="w-16 h-10 relative rounded overflow-hidden bg-gray-100 border">
//             {slide.desktopMediaType === "image" ? (
//               <img
//                 src={slide.desktopMediaUrl}
//                 alt={slide.altText || "Desktop preview"}
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <video
//                 src={slide.desktopMediaUrl}
//                 className="w-full h-full object-cover"
//                 muted
//               />
//             )}
//             <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 text-center">
//               Desktop
//             </div>
//           </div>
//           <div className="w-12 h-10 relative rounded overflow-hidden bg-gray-100 border">
//             {slide.mobileMediaType === "image" ? (
//               <img
//                 src={slide.mobileMediaUrl}
//                 alt={slide.altText || "Mobile preview"}
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <video
//                 src={slide.mobileMediaUrl}
//                 className="w-full h-full object-cover"
//                 muted
//               />
//             )}
//             <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 text-center">
//               Mobile
//             </div>
//           </div>
//         </div>
//       </TableCell>

//       {/* Title */}
//       <TableCell>
//         <div>
//           <div className="font-medium">
//             {slide.title || <span className="text-gray-400 italic">Untitled</span>}
//           </div>
//           {slide.altText && (
//             <div className="text-xs text-gray-500 truncate max-w-xs">
//               {slide.altText}
//             </div>
//           )}
//         </div>
//       </TableCell>

//       {/* Link Type */}
//       <TableCell>
//         <Badge variant="outline" className="flex items-center gap-1 w-fit">
//           {getLinkIcon()}
//           {getLinkLabel()}
//         </Badge>
//       </TableCell>

//       <TableCell>
//         <Badge variant={slide.isPublished ? "default" : "secondary"}>
//           {slide.isPublished ? "Published" : "Draft"}
//         </Badge>
//       </TableCell>

//       {/* Sort Order */}
//       <TableCell className="text-center">{slide.sortOrder}</TableCell>

//       {/* Actions */}
//       <TableCell>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" size="sm" disabled={isTogglingPublish}>
//               {isTogglingPublish ? (
//                 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
//               ) : (
//                 <MoreHorizontal className="h-4 w-4" />
//               )}

//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem onClick={onEdit} disabled={isTogglingPublish}>
//               <Edit className="h-4 w-4 mr-2" />
//               Edit
//             </DropdownMenuItem>
//             <DropdownMenuItem onClick={onTogglePublish} disabled={isTogglingPublish}>
//               {isTogglingPublish ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Updating...
//                 </>
//               ) : slide.isPublished ? (
//                 <>
//                   <EyeOff className="h-4 w-4 mr-2" />
//                   Unpublish
//                 </>
//               ) : (
//                 <>
//                   <Eye className="h-4 w-4 mr-2" />
//                   Publish
//                 </>
//               )}
//             </DropdownMenuItem>
//             <DropdownMenuItem
//               onClick={onDelete}
//               className="text-red-600"
//               disabled={isTogglingPublish}
//             >
//               <Trash2 className="h-4 w-4 mr-2" />
//               Delete
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </TableCell>
//     </TableRow>
//   );
// };

// const HeroSlidesTable: React.FC<HeroSlidesTableProps> = ({ slides: initialSlides }) => {
//   const router = useRouter();
//   const [slides, setSlides] = useState(initialSlides);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [togglingSlideId, setTogglingSlideId] = useState<string | null>(null);

//   // Drag and drop sensors
//   const sensors = useSensors(
//     useSensor(PointerSensor),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   // Handle drag end (keeping optimistic update for drag-and-drop)
//   const handleDragEnd = async (event: DragEndEvent) => {
//     const { active, over } = event;

//     if (!over || active.id === over.id) return;

//     const oldIndex = slides.findIndex((s) => s.id === active.id);
//     const newIndex = slides.findIndex((s) => s.id === over.id);

//     const newSlides = arrayMove(slides, oldIndex, newIndex);

//     // Update local state immediately for smooth UX (visual feedback is crucial for drag-and-drop)
//     setSlides(newSlides);

//     // Update sort orders
//     const slideOrders = newSlides.map((slide, index) => ({
//       id: slide.id,
//       sortOrder: index,
//     }));

//     // Persist to database
//     const result = await reorderHeroSlides(slideOrders);

//     if (result.success) {
//       toast.success("Slide order updated");
//       router.refresh();
//     } else {
//       toast.error("Failed to update slide order");
//       setSlides(initialSlides); // Revert on error
//     }
//   };

//   // Handle delete
//   const handleDelete = async () => {
//     if (!slideToDelete) return;

//     setIsDeleting(true);
//     const result = await deleteHeroSlide(slideToDelete);

//     if (result.success) {
//       toast.success("Slide deleted successfully");
//       setDeleteDialogOpen(false);
//       setSlideToDelete(null);
//       router.refresh();
//     } else {
//       toast.error(result.error || "Failed to delete slide");
//     }

//     setIsDeleting(false);
//   };

//   // Handle toggle publish with loading-only approach (NO optimistic update)
//   const handleTogglePublish = async (slideId: string, currentStatus: boolean) => {
//     // Set loading state
//     setTogglingSlideId(slideId);

//     // Perform the server action (no UI update before this)
//     const newStatus = !currentStatus;
//     const result = await toggleHeroSlidePublish(slideId, newStatus);

//     if (result.success) {
//       toast.success(newStatus ? "Slide published" : "Slide unpublished");
//       // Refresh to get the updated state from server
//       router.refresh();

//       // Update local state immediately after refresh is triggered
//       // This ensures UI updates even before router.refresh() completes
//       setSlides((prevSlides) =>
//         prevSlides.map((slide) =>
//           slide.id === slideId
//             ? { ...slide, isPublished: newStatus }
//             : slide
//         )
//       );
//     } else {
//       toast.error(result.error || "Failed to update slide status");
//     }

//     // Clear loading state
//     setTogglingSlideId(null);
//   };

//   if (slides.length === 0) {
//     return (
//       <Card className="text-center">
//         <div className="flex flex-col items-center gap-4">
//           <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
//             <Layers className="h-8 w-8 text-gray-400" />
//           </div>
//           <div>
//             <h3 className="text-lg font-medium mb-1">No Hero Slides</h3>
//             <p className="text-sm text-gray-500 mb-4">
//               Get started by creating your first hero slide
//             </p>
//             <Button onClick={() => router.push("/dashboard/hero-slides/new")}>
//               <Plus className="h-4 w-4 mr-2" />
//               Add New Slide
//             </Button>
//           </div>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <>
//       <Card>
//         <DndContext
//           sensors={sensors}
//           collisionDetection={closestCenter}
//           onDragEnd={handleDragEnd}
//         >
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead className="w-8"></TableHead>
//                 <TableHead>Preview</TableHead>
//                 <TableHead>Title</TableHead>
//                 <TableHead>Link Type</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead className="text-center">Order</TableHead>
//                 <TableHead></TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               <SortableContext
//                 items={slides.map((s) => s.id)}
//                 strategy={verticalListSortingStrategy}
//               >
//                 {slides.map((slide) => (
//                   <SortableRow
//                     key={slide.id}
//                     slide={slide}
//                     onEdit={() => router.push(`/dashboard/hero-slides/${slide.id}/edit`)}
//                     onDelete={() => {
//                       setSlideToDelete(slide.id);
//                       setDeleteDialogOpen(true);
//                     }}
//                     onTogglePublish={() =>
//                       handleTogglePublish(slide.id, slide.isPublished)
//                     }
//                     isTogglingPublish={togglingSlideId === slide.id}
//                   />
//                 ))}
//               </SortableContext>
//             </TableBody>
//           </Table>
//         </DndContext>
//       </Card>

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Hero Slide</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete this slide? This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               disabled={isDeleting}
//               className="bg-red-600 hover:bg-red-700"
//             >
//               {isDeleting ? "Deleting..." : "Delete"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// };

// export default HeroSlidesTable;