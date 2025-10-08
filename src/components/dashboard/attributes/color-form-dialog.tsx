"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { colorFormSchema, type ColorFormData } from "@/lib/validations/dashboard";
import { createColor, updateColor, type ColorWithStats } from "@/lib/actions/color-management";
import { toast } from "sonner";
import { useDirection } from "@radix-ui/react-direction";

interface ColorFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    mode?: "create" | "edit";
    initialData?: ColorWithStats;
}

const ColorFormDialog: React.FC<ColorFormDialogProps> = ({
    open,
    onOpenChange,
    onSuccess,
    mode = "create",
    initialData
}) => {
    const direction = useDirection();
    const [isLoading, setIsLoading] = useState(false);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

    const isEditMode = mode === "edit";

    const form = useForm<ColorFormData>({
        resolver: zodResolver(colorFormSchema),
        defaultValues: {
            name: initialData?.name || "",
            slug: initialData?.slug || "",
            hexCode: initialData?.hexCode || "#FF0000",
        },
    });

    // Watch fields for auto-generation and preview
    const watchedName = form.watch("name");
    const watchedHexCode = form.watch("hexCode");

    // Reset form when dialog opens/closes or initialData changes
    useEffect(() => {
        if (open) {
            form.reset({
                name: initialData?.name || "",
                slug: initialData?.slug || "",
                hexCode: initialData?.hexCode || "#FF0000",
            });
            setIsSlugManuallyEdited(isEditMode && !!initialData);
        }
    }, [open, initialData, isEditMode, form]);

    // Enhanced slug generation function
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .replace(/-{2,}/g, "-");
    };

    // Auto-generate slug from name
    useEffect(() => {
        if (open && !isEditMode && !isSlugManuallyEdited && watchedName) {
            const newSlug = generateSlug(watchedName);
            form.setValue("slug", newSlug);
        }
    }, [watchedName, isEditMode, isSlugManuallyEdited, form, open]);

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

    const handleCancel = () => {
        onOpenChange(false);
        form.reset();
        setIsSlugManuallyEdited(false);
    };

    const onSubmit = async (data: ColorFormData) => {
        setIsLoading(true);

        try {
            let result;

            if (isEditMode && initialData?.id) {
                result = await updateColor(initialData.id, data);
            } else {
                result = await createColor(data);
            }

            if (result.success) {
                toast.success(isEditMode ? "Color updated successfully" : "Color created successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.error || "Failed to save color");

                // Handle field errors
                if (result.fieldErrors) {
                    Object.entries(result.fieldErrors).forEach(([field, errors]) => {
                        form.setError(field as keyof ColorFormData, {
                            message: errors.join(', '),
                        });
                    });
                }
            }
        } catch (error) {
            console.error("Error saving color:", error);
            toast.error("Failed to save color. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const dialogTitle = isEditMode ? "Edit Color" : "Add New Color";
    const dialogDescription = isEditMode && initialData
        ? `Modify "${initialData.name}" color attribute`
        : "Create a new color attribute for your product variants";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col p-0 sm:max-w-lg h-[90vh] max-h-[600px] overflow-hidden gap-0"
                dir={direction}
            >
                {/* Fixed Header */}
                <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base 2xl:text-lg font-semibold">
                        {dialogTitle}
                    </DialogTitle>
                    <DialogDescription className="text-xs 2xl:text-sm text-muted-foreground">
                        {dialogDescription}
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full px-6 py-4">
                        <Form {...form}>
                            <form
                                id="color-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color Name *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter color name (e.g., Ruby Red)"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Descriptive name for the color
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
                                                            placeholder="color-slug"
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
                                                        className="flex-shrink-0 px-3"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
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
                                        name="hexCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hex Color Code *</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="#FF0000"
                                                            {...field}
                                                            className="font-mono"
                                                        />
                                                    </FormControl>
                                                    <input
                                                        type="color"
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                        className="w-12 h-10 rounded border border-input cursor-pointer flex-shrink-0"
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                <FormDescription>
                                                    6-digit hex color code (e.g., #FF5733)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Color Preview */}
                                <div className="p-4 border rounded-lg bg-muted/20">
                                    <div className="text-sm font-medium mb-3">Preview</div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-lg border-2 border-border shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: watchedHexCode }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">
                                                {form.watch("name") || "Color Name"}
                                            </div>
                                            <div className="text-sm text-muted-foreground font-mono truncate">
                                                {watchedHexCode}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                /{form.watch("slug") || "color-slug"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </ScrollArea>
                </div>

                {/* Fixed Footer */}
                <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-border">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="color-form"
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isLoading ? "Saving..." : isEditMode ? "Update Color" : "Create Color"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ColorFormDialog;