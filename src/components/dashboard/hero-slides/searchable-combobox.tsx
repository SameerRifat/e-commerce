// src/components/ui/searchable-combobox.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";

export interface ComboboxOption {
    id: string;
    name: string;
    meta?: string; // For displaying additional info like SKU
}

interface SearchableComboboxProps {
    value?: string;
    onValueChange: (value: string | null) => void;
    placeholder?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    onSearch: (query: string, offset: number) => Promise<{
        data: ComboboxOption[];
        hasMore: boolean;
    }>;
    onGetById?: (id: string) => Promise<ComboboxOption | null>;
    disabled?: boolean;
}

export function SearchableCombobox({
    value,
    onValueChange,
    placeholder = "Select an option...",
    emptyMessage = "No results found.",
    searchPlaceholder = "Search...",
    onSearch,
    onGetById,
    disabled = false,
}: SearchableComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<ComboboxOption | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);

    const debouncedSearch = useDebounce(search, 300);
    const listRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);

    // Load initial selected option when value changes
    useEffect(() => {
        if (value && onGetById && !selectedOption) {
            onGetById(value).then((option) => {
                if (option) setSelectedOption(option);
            });
        } else if (!value) {
            setSelectedOption(null);
        }
    }, [value, onGetById, selectedOption]);

    // Fetch data when search changes
    useEffect(() => {
        // Skip initial mount to avoid unnecessary fetch
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Only fetch when popover is open
        if (!open) return;

        const fetchData = async () => {
            setIsLoading(true);
            setOffset(0);

            try {
                const result = await onSearch(debouncedSearch, 0);
                setOptions(result.data);
                setHasMore(result.hasMore);
            } catch (error) {
                console.error("Error fetching options:", error);
                setOptions([]);
                setHasMore(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [debouncedSearch, open, onSearch]);

    // Initial data load when popover opens
    useEffect(() => {
        if (open && options.length === 0 && !isLoading) {
            const fetchInitialData = async () => {
                setIsLoading(true);
                try {
                    const result = await onSearch("", 0);
                    setOptions(result.data);
                    setHasMore(result.hasMore);
                } catch (error) {
                    console.error("Error fetching initial options:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInitialData();
        }
    }, [open, options.length, isLoading, onSearch]);

    // Load more on scroll
    const handleScroll = useCallback(
        async (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.currentTarget;
            const bottom =
                target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

            if (bottom && hasMore && !isLoading) {
                setIsLoading(true);
                const newOffset = offset + 20;

                try {
                    const result = await onSearch(debouncedSearch, newOffset);
                    setOptions((prev) => [...prev, ...result.data]);
                    setHasMore(result.hasMore);
                    setOffset(newOffset);
                } catch (error) {
                    console.error("Error loading more options:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        },
        [hasMore, isLoading, offset, debouncedSearch, onSearch]
    );

    const handleSelect = (selectedId: string) => {
        const selected = options.find((opt) => opt.id === selectedId);
        if (selected) {
            setSelectedOption(selected);
            onValueChange(selectedId);
        } else {
            setSelectedOption(null);
            onValueChange(null);
        }
        setOpen(false);
    };

    const handleClear = () => {
        setSelectedOption(null);
        onValueChange(null);
        setSearch("");
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedOption ? (
                        <span className="truncate">{selectedOption.name}</span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList ref={listRef} onScroll={handleScroll}>
                        <CommandEmpty>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        Loading...
                                    </span>
                                </div>
                            ) : (
                                emptyMessage
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={option.id}
                                    onSelect={handleSelect}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{option.name}</span>
                                        {option.meta && (
                                            <span className="text-xs text-muted-foreground">
                                                {option.meta}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                            {isLoading && options.length > 0 && (
                                <div className="flex items-center justify-center py-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
                {selectedOption && (
                    <div className="border-t p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={handleClear}
                        >
                            Clear selection
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}