// src/components/dashboard/attributes/size-form-dialog.tsx
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
import { Badge } from "@/components/ui/badge";
import { sizeFormSchema, type SizeFormData } from "@/lib/validations/dashboard";
import { createSize, updateSize, getNextSortOrder, type SizeWithStats } from "@/lib/actions/size-management";
import SizeCategoryCombobox from "./size-category-combobox";
import { toast } from "sonner";
import { useDirection } from "@radix-ui/react-direction";

interface SizeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialData?: SizeWithStats;
}


const SizeFormDialog: React.FC<SizeFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  mode = "create",
  initialData
}) => {
  const direction = useDirection();
  const [isLoading, setIsLoading] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [nextSortOrder, setNextSortOrder] = useState<number>(1);

  const isEditMode = mode === "edit";

  const form = useForm<SizeFormData>({
    resolver: zodResolver(sizeFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      sortOrder: initialData?.sortOrder || 1,
      categoryId: initialData?.categoryId || undefined,
    },
  });

  // Watch fields for auto-generation
  const watchedName = form.watch("name");
  const watchedSortOrder = form.watch("sortOrder");

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || "",
        slug: initialData?.slug || "",
        sortOrder: initialData?.sortOrder || 1,
        categoryId: initialData?.categoryId || undefined,
      });
      setIsSlugManuallyEdited(isEditMode && !!initialData);
      
      if (!isEditMode) {
        getNextSortOrder().then(setNextSortOrder);
      }
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

  const onSubmit = async (data: SizeFormData) => {
    setIsLoading(true);
    
    try {
      let result;
      
      if (isEditMode && initialData?.id) {
        result = await updateSize(initialData.id, data);
      } else {
        result = await createSize(data);
      }

      if (result.success) {
        toast.success(isEditMode ? "Size updated successfully" : "Size created successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to save size");
        
        // Handle field errors
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof SizeFormData, {
              message: errors.join(', '),
            });
          });
        }
      }
    } catch (error) {
      console.error("Error saving size:", error);
      toast.error("Failed to save size. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const dialogTitle = isEditMode ? "Edit Size" : "Add New Size";
  const dialogDescription = isEditMode && initialData 
    ? `Modify "${initialData.name}" size attribute`
    : "Create a new size attribute for your product variants";

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
                id="size-form" 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-6"
              >

                {/* Form Fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <SizeCategoryCombobox
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            placeholder="Select or create category..."
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Group this size with other related sizes for better organization
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter size name (e.g., XL, 30ml, Standard)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Descriptive name for the size (e.g., XL, 30ml, Travel Size)
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
                              placeholder="size-slug"
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
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder={nextSortOrder.toString()}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Order in which this size should appear (lower numbers first). 
                          {!isEditMode && ` Next available: ${nextSortOrder}`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Size Preview */}
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="text-sm font-medium mb-3">Preview</div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {watchedSortOrder || 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {form.watch("name") || "Size Name"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        /{form.watch("slug") || "size-slug"}
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
            form="size-form"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Saving..." : isEditMode ? "Update Size" : "Create Size"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SizeFormDialog;