// src/components/dashboard/collections/collection-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/dashboard/page-header";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import {
    createCollection,
    updateCollection,
} from "@/lib/actions/collections";
import CollectionImageUpload from "./collection-image-upload";
import ManualProductSelector from "./manual-product-selector";
import { BulkProductSelector } from "./bulk-product-selector";
import { CollectionProductsReorder } from "./collection-products-reorder";
import { CollectionFormData, collectionFormSchema } from "./collection-form-schema";
import { SelectCollection } from "@/lib/db/schema";
import { getCollectionProductsById } from "@/lib/actions/collections";

interface CollectionFormProps {
    mode: "create" | "edit";
    collectionId?: string;
    initialData?: SelectCollection;
}

const CollectionForm: React.FC<CollectionFormProps> = ({
    mode,
    collectionId,
    initialData,
}) => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const [collectionProducts, setCollectionProducts] = useState<Array<{ id: string; name: string; sku: string | null }>>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const { startUpload, isUploading } = useUploadThing("collectionImageUploader", {
        onClientUploadComplete: (res) => {
            console.log("Upload complete:", res);
        },
        onUploadError: (error) => {
            console.error("Upload error:", error);
            toast.error("Upload failed");
        },
    });

    const form = useForm<CollectionFormData>({
        resolver: zodResolver(collectionFormSchema),
        mode: "onSubmit",
        defaultValues: {
            name: initialData?.name || "",
            slug: initialData?.slug || "",
            description: initialData?.description || "",
            imageUrl: initialData?.imageUrl || "",
            thumbnailUrl: initialData?.thumbnailUrl || "",
            isPublished: initialData?.isPublished || false,
            isFeatured: initialData?.isFeatured || false,
            metaTitle: initialData?.metaTitle || "",
            metaDescription: initialData?.metaDescription || "",
        },
    });

    const watchedName = form.watch("name");

    // Set slug as manually edited if in edit mode
    useEffect(() => {
        if (mode === "edit" && initialData) {
            setIsSlugManuallyEdited(true);
        }
    }, [mode, initialData]);

    // Load collection products for edit mode
    useEffect(() => {
        if (mode === "edit" && collectionId) {
            loadCollectionProducts();
        }
    }, [mode, collectionId]);

    const loadCollectionProducts = async () => {
        if (!collectionId) return;

        setIsLoadingProducts(true);
        try {
            const result = await getCollectionProductsById(collectionId);
            if (result.success && result.data) {
                setCollectionProducts(result.data);
            }
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // Auto-generate slug from name
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .replace(/-{2,}/g, "-");
    };

    useEffect(() => {
        if (!mode || mode === "create") {
            if (!isSlugManuallyEdited && watchedName) {
                const newSlug = generateSlug(watchedName);
                form.setValue("slug", newSlug);
            }
        }
    }, [watchedName, mode, isSlugManuallyEdited, form]);

    const handleGenerateSlug = () => {
        const currentName = form.getValues("name");
        if (currentName.trim()) {
            const newSlug = generateSlug(currentName);
            form.setValue("slug", newSlug);
            form.trigger("slug");
            setIsSlugManuallyEdited(false);
        }
    };

    const handleSlugInputChange = (value: string) => {
        setIsSlugManuallyEdited(true);
        form.setValue("slug", value);
    };

    const onSubmit = async (data: CollectionFormData) => {
        setIsSubmitting(true);

        try {
            let result;
            if (mode === "create") {
                result = await createCollection(data);
            } else {
                result = await updateCollection(collectionId!, data);
            }

            if (result.success) {
                toast.success(
                    mode === "create" ? "Collection created" : "Collection updated"
                );
                router.push("/dashboard/collections");
            } else {
                toast.error(result.error || "Failed to save collection");

                if (result.fieldErrors) {
                    Object.entries(result.fieldErrors).forEach(([field, errors]) => {
                        form.setError(field as keyof CollectionFormData, {
                            type: "server",
                            message: errors.join(", "),
                        });
                    });
                }
            }
        } catch (error) {
            console.error("Error saving collection:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={mode === "create" ? "Create Collection" : "Edit Collection"}
                description="Curate product collections for marketing campaigns and seasonal promotions"
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/collections")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Collections
                    </Button>
                </div>
            </PageHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs defaultValue="basic" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-6">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="images">Images</TabsTrigger>
                            <TabsTrigger value="products">Products</TabsTrigger>
                            <TabsTrigger value="bulk" disabled={mode === "create"}>
                                Bulk Add
                            </TabsTrigger>
                            <TabsTrigger value="reorder" disabled={mode === "create"}>
                                Reorder
                            </TabsTrigger>
                            <TabsTrigger value="seo">SEO</TabsTrigger>
                        </TabsList>

                        {/* Basic Information Tab */}
                        <TabsContent value="basic" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Collection Name *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., Summer Collection 2024"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Choose a clear, descriptive name for your collection
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL Slug *</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="summer-collection-2024"
                                                            {...field}
                                                            onChange={(e) => handleSlugInputChange(e.target.value)}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleGenerateSlug}
                                                        disabled={!watchedName?.trim()}
                                                        className="flex-shrink-0"
                                                    >
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Generate
                                                    </Button>
                                                </div>
                                                <FormDescription>
                                                    URL-friendly version (lowercase, hyphens only)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe this collection..."
                                                        rows={4}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Marketing copy for the collection page
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="isPublished"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Publish Collection</FormLabel>
                                                        <FormDescription className="text-xs">
                                                            Make visible on storefront
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="isFeatured"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Featured Collection</FormLabel>
                                                        <FormDescription className="text-xs">
                                                            Show in navbar & homepage
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Images Tab */}
                        <TabsContent value="images" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Collection Images</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hero Image (Optional)</FormLabel>
                                                <FormControl>
                                                    <CollectionImageUpload
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        startUpload={startUpload}
                                                        aspectRatio="16/6"
                                                        label="Hero Image"
                                                        description="Large banner for collection page (recommended: 2400×900px)"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="thumbnailUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Thumbnail Image (Optional)</FormLabel>
                                                <FormControl>
                                                    <CollectionImageUpload
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        startUpload={startUpload}
                                                        aspectRatio="1/1"
                                                        label="Thumbnail"
                                                        description="Square image for cards/grid (recommended: 800×800px)"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Products Tab */}
                        <TabsContent value="products">
                            <ManualProductSelector
                                collectionId={collectionId}
                                mode={mode}
                            />
                        </TabsContent>

                        {/* Bulk Add Tab */}
                        <TabsContent value="bulk">
                            {mode === "edit" && collectionId ? (
                                <BulkProductSelector
                                    collectionId={collectionId}
                                    existingProductIds={collectionProducts.map((p) => p.id)}
                                    onProductsAdded={loadCollectionProducts}
                                />
                            ) : (
                                <Card>
                                    <CardContent className="py-12">
                                        <p className="text-center text-muted-foreground">
                                            Save the collection first to use bulk product operations
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Reorder Tab */}
                        <TabsContent value="reorder">
                            {mode === "edit" && collectionId ? (
                                <CollectionProductsReorder
                                    collectionId={collectionId}
                                    initialProducts={collectionProducts}
                                />
                            ) : (
                                <Card>
                                    <CardContent className="py-12">
                                        <p className="text-center text-muted-foreground">
                                            Save the collection first to reorder products
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* SEO Tab */}
                        <TabsContent value="seo" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>SEO Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="metaTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Collection SEO Title"
                                                        {...field}
                                                        maxLength={60}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value?.length || 0}/60 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="metaDescription"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Collection SEO Description"
                                                        rows={3}
                                                        {...field}
                                                        maxLength={160}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {field.value?.length || 0}/160 characters
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/dashboard/collections")}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting
                                ? "Saving..."
                                : mode === "create"
                                    ? "Create Collection"
                                    : "Update Collection"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default CollectionForm;