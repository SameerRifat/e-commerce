// src/components/dashboard/attributes/size-category-combobox.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getSizeCategories, createSizeCategory, type SizeCategoryWithStats } from "@/lib/actions/size-category-management";
import { toast } from "sonner";

interface SizeCategoryComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SizeCategoryCombobox: React.FC<SizeCategoryComboboxProps> = ({
  value,
  onValueChange,
  placeholder = "Select category...",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<SizeCategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await getSizeCategories();
      setCategories(result);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createSizeCategory(newCategoryName.trim());
      
      if (result.success && result.data) {
        toast.success("Category created successfully");
        
        // Reload categories
        await loadCategories();
        
        // Select the newly created category
        onValueChange(result.data.categoryId);
        
        // Close dialogs and reset state
        setShowAddDialog(false);
        setNewCategoryName("");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to create category");
        
        // Handle field errors
        if (result.fieldErrors?.name) {
          toast.error(result.fieldErrors.name[0]);
        }
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddNewClick = () => {
    // Pre-fill dialog input with current search text if available
    setNewCategoryName(searchValue.trim());
    setShowAddDialog(true);
  };

  const selectedCategory = categories.find(category => category.id === value);
  
  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedCategory ? selectedCategory.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search categories..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <ScrollArea className="max-h-[200px]">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading categories...</span>
                  </div>
                ) : (
                  <>
                    <CommandEmpty>
                      No categories found.
                    </CommandEmpty>

                    <CommandGroup>
                      {/* None/Uncategorized option */}
                      <CommandItem
                        value=""
                        onSelect={() => {
                          onValueChange(undefined);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-muted-foreground italic">Uncategorized</span>
                      </CommandItem>

                      {/* Existing categories */}
                      {filteredCategories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.id}
                          onSelect={(currentValue) => {
                            onValueChange(currentValue === value ? undefined : currentValue);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === category.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center justify-between w-full">
                            <span>{category.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {category.sizeCount} sizes
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </ScrollArea>
            </CommandList>
            
            {/* Always visible separator and add button */}
            <CommandSeparator />
            <CommandGroup>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start font-normal px-1.5"
                onClick={handleAddNewClick}
                disabled={disabled || loading}
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add new category
              </Button>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Size Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your sizes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Clothing Sizes, Volume, etc."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateCategory();
                  }
                }}
                disabled={isCreating}
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {newCategoryName.length}/50 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewCategoryName("");
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={isCreating || !newCategoryName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SizeCategoryCombobox;