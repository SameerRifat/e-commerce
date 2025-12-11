// src/components/dashboard/collections/collection-products-reorder.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Loader2, ArrowUpDown, Package } from "lucide-react";
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
import { toast } from "sonner";
import { reorderCollectionProducts } from "@/lib/actions/collections";
import { useRouter } from "next/navigation";

interface Product {
    id: string;
    name: string;
    sku: string | null;
}

interface CollectionProductsReorderProps {
    collectionId: string;
    initialProducts: Product[];
}

// Sortable Product Row Component
const SortableProductRow: React.FC<{ product: Product; index: number }> = ({
    product,
    index,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 bg-background"
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-move hover:bg-muted rounded p-1"
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                {product.sku && (
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                )}
            </div>
            <Badge variant="secondary" className="text-xs">
                #{index + 1}
            </Badge>
        </div>
    );
};

export function CollectionProductsReorder({
    collectionId,
    initialProducts,
}: CollectionProductsReorderProps) {
    const router = useRouter();
    const [products, setProducts] = useState(initialProducts);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = products.findIndex((p) => p.id === active.id);
        const newIndex = products.findIndex((p) => p.id === over.id);

        setProducts(arrayMove(products, oldIndex, newIndex));
        setHasChanges(true);
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            const result = await reorderCollectionProducts(
                collectionId,
                products.map((p, index) => ({ productId: p.id, sortOrder: index }))
            );

            if (result.success) {
                toast.success("Product order updated successfully");
                setHasChanges(false);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update order");
                setProducts(initialProducts);
                setHasChanges(false);
            }
        } catch (error) {
            toast.error("Failed to update order");
            setProducts(initialProducts);
            setHasChanges(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setProducts(initialProducts);
        setHasChanges(false);
        toast.info("Changes discarded");
    };

    if (products.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Reorder Products</CardTitle>
                    <CardDescription>
                        Arrange products in the order you want them to appear
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium mb-1">No products to reorder</h3>
                        <p className="text-sm text-muted-foreground">
                            Add products to this collection first
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Reorder Products</CardTitle>
                        <CardDescription>
                            Drag products to change their display order in the collection
                        </CardDescription>
                    </div>
                    {hasChanges && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Unsaved Changes
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>
                        Drag and drop products to reorder. Changes will be saved when you click
                        &quot;Save Order&quot;.
                    </span>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={products.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                            {products.map((product, index) => (
                                <SortableProductRow
                                    key={product.id}
                                    product={product}
                                    index={index}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={handleSaveOrder}
                        disabled={!hasChanges || isSaving}
                        className="flex-1"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving Order...
                            </>
                        ) : (
                            "Save Order"
                        )}
                    </Button>
                    {hasChanges && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={isSaving}
                        >
                            Discard
                        </Button>
                    )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    {products.length} product{products.length !== 1 ? "s" : ""} in this collection
                </p>
            </CardContent>
        </Card>
    );
}
