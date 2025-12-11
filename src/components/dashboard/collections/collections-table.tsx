// src/components/dashboard/collections/collections-table.tsx
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
    Star,
    Layers,
    Plus,
    Loader2,
    Copy,
} from "lucide-react";
import {
    deleteCollection,
    toggleCollectionPublish,
    reorderCollections,
    duplicateCollection,
    type CollectionWithMeta,
} from "@/lib/actions/collections";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface CollectionsTableProps {
    collections: CollectionWithMeta[];
}

// Sortable Row Component
const SortableRow: React.FC<{
    collection: CollectionWithMeta;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onTogglePublish: () => void;
    isTogglingPublish: boolean;
}> = ({ collection, onEdit, onDelete, onDuplicate, onTogglePublish, isTogglingPublish }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: collection.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableRow ref={setNodeRef} style={style}>
            {/* Drag Handle */}
            <TableCell className="w-8">
                <div {...attributes} {...listeners} className="cursor-move">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
            </TableCell>

            {/* Preview Image */}
            <TableCell>
                {collection.thumbnailUrl ? (
                    <img
                        src={collection.thumbnailUrl}
                        alt={collection.name}
                        className="w-16 h-16 object-cover rounded"
                    />
                ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <Layers className="h-8 w-8 text-gray-400" />
                    </div>
                )}
            </TableCell>

            {/* Name */}
            <TableCell>
                <div>
                    <div className="font-medium">{collection.name}</div>
                    {collection.isFeatured && (
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Featured
                            </Badge>
                        </div>
                    )}
                </div>
            </TableCell>

            {/* Product Count */}
            <TableCell className="text-center">
                {collection.productCount}
            </TableCell>

            {/* Status */}
            <TableCell>
                <Badge variant={collection.isPublished ? "default" : "secondary"}>
                    {collection.isPublished ? "Published" : "Draft"}
                </Badge>
            </TableCell>

            {/* Display Order */}
            <TableCell className="text-center">{collection.displayOrder}</TableCell>

            {/* Actions */}
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isTogglingPublish}>
                            {isTogglingPublish ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <MoreHorizontal className="h-4 w-4" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDuplicate}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onTogglePublish}>
                            {collection.isPublished ? (
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

const CollectionsTable: React.FC<CollectionsTableProps> = ({ collections: initialCollections }) => {
    const router = useRouter();
    const [collections, setCollections] = useState(initialCollections);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingCollectionId, setTogglingCollectionId] = useState<string | null>(null);
    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [collectionToDuplicate, setCollectionToDuplicate] = useState<CollectionWithMeta | null>(null);
    const [duplicateName, setDuplicateName] = useState("");
    const [isDuplicating, setIsDuplicating] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = collections.findIndex((c) => c.id === active.id);
        const newIndex = collections.findIndex((c) => c.id === over.id);

        const newCollections = arrayMove(collections, oldIndex, newIndex);
        setCollections(newCollections);

        const collectionOrders = newCollections.map((collection, index) => ({
            id: collection.id,
            displayOrder: index,
        }));

        const result = await reorderCollections(collectionOrders);

        if (result.success) {
            toast.success("Collection order updated");
            router.refresh();
        } else {
            toast.error("Failed to update collection order");
            setCollections(initialCollections);
        }
    };

    const handleDelete = async () => {
        if (!collectionToDelete) return;

        setIsDeleting(true);
        const result = await deleteCollection(collectionToDelete);

        if (result.success) {
            toast.success("Collection deleted successfully");
            setCollections((prev) =>
                prev.filter((collection) => collection.id !== collectionToDelete)
            );
            setDeleteDialogOpen(false);
            setCollectionToDelete(null);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete collection");
        }

        setIsDeleting(false);
    };

    const handleTogglePublish = async (collectionId: string, currentStatus: boolean) => {
        setTogglingCollectionId(collectionId);

        const newStatus = !currentStatus;
        const result = await toggleCollectionPublish(collectionId, newStatus);

        if (result.success) {
            toast.success(newStatus ? "Collection published" : "Collection unpublished");
            router.refresh();

            setCollections((prev) =>
                prev.map((collection) =>
                    collection.id === collectionId
                        ? { ...collection, isPublished: newStatus }
                        : collection
                )
            );
        } else {
            toast.error(result.error || "Failed to update collection status");
        }

        setTogglingCollectionId(null);
    };

    const handleDuplicateClick = (collection: CollectionWithMeta) => {
        setCollectionToDuplicate(collection);
        setDuplicateName(`${collection.name} (Copy)`);
        setDuplicateDialogOpen(true);
    };

    const handleDuplicate = async () => {
        if (!collectionToDuplicate || !duplicateName.trim()) return;

        setIsDuplicating(true);
        const result = await duplicateCollection(collectionToDuplicate.id, duplicateName.trim());

        if (result.success) {
            toast.success("Collection duplicated successfully");
            setDuplicateDialogOpen(false);
            setCollectionToDuplicate(null);
            setDuplicateName("");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to duplicate collection");
        }

        setIsDuplicating(false);
    };

    if (collections.length === 0) {
        return (
            <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Layers className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium mb-1">No Collections</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Get started by creating your first collection
                        </p>
                        <Button onClick={() => router.push("/dashboard/collections/new")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Collection
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
                                <TableHead>Name</TableHead>
                                <TableHead className="text-center">Products</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Order</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SortableContext
                                items={collections.map((c) => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {collections.map((collection) => (
                                    <SortableRow
                                        key={collection.id}
                                        collection={collection}
                                        onEdit={() => router.push(`/dashboard/collections/${collection.id}/edit`)}
                                        onDelete={() => {
                                            setCollectionToDelete(collection.id);
                                            setDeleteDialogOpen(true);
                                        }}
                                        onDuplicate={() => handleDuplicateClick(collection)}
                                        onTogglePublish={() =>
                                            handleTogglePublish(collection.id, collection.isPublished)
                                        }
                                        isTogglingPublish={togglingCollectionId === collection.id}
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
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this collection? This action cannot be undone.
                            Products in this collection will not be deleted.
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

            {/* Duplicate Collection Dialog */}
            <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Duplicate Collection</DialogTitle>
                        <DialogDescription>
                            Create a copy of &quot;{collectionToDuplicate?.name}&quot; with all its products.
                            The new collection will be created as a draft.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="duplicate-name">New Collection Name</Label>
                            <Input
                                id="duplicate-name"
                                value={duplicateName}
                                onChange={(e) => setDuplicateName(e.target.value)}
                                placeholder="Enter collection name"
                                disabled={isDuplicating}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDuplicateDialogOpen(false)}
                            disabled={isDuplicating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDuplicate}
                            disabled={!duplicateName.trim() || isDuplicating}
                        >
                            {isDuplicating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Duplicating...
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CollectionsTable;