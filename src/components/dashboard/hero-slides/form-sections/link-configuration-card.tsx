// src/components/dashboard/hero-slides/form-sections/link-configuration-card.tsx
"use client";

import React from "react";
import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    searchProducts,
    searchCollections,
    getProductById,
    getCollectionById
} from "@/lib/actions/hero-slides-search";
import { HeroSlideFormData } from "../hero-slide-form-schema";
import { SearchableCombobox } from "../searchable-combobox";

interface LinkConfigurationCardProps {
    control: Control<HeroSlideFormData>;
    linkType: "product" | "collection" | "external" | "none";
}

const LinkConfigurationCard: React.FC<LinkConfigurationCardProps> = ({
    control,
    linkType,
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Link Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="linkType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link Type</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select link type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">No Link</SelectItem>
                                    <SelectItem value="product">Product</SelectItem>
                                    <SelectItem value="collection">Collection</SelectItem>
                                    <SelectItem value="external">External URL</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Where should this slide navigate when clicked?
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {linkType === "product" && (
                    <FormField
                        control={control}
                        name="linkedProductId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select Product</FormLabel>
                                <FormControl>
                                    <SearchableCombobox
                                        value={field.value || undefined}
                                        onValueChange={(value) => field.onChange(value)}
                                        placeholder="Search and select a product..."
                                        searchPlaceholder="Search products by name or SKU..."
                                        emptyMessage="No products found."
                                        onSearch={async (query, offset) => {
                                            const result = await searchProducts(query, 20, offset);
                                            return {
                                                data: result.data.map((p) => ({
                                                    id: p.id,
                                                    name: p.name,
                                                    meta: p.sku || undefined,
                                                })),
                                                hasMore: result.hasMore,
                                            };
                                        }}
                                        onGetById={async (id) => {
                                            const product = await getProductById(id);
                                            if (!product) return null;
                                            return {
                                                id: product.id,
                                                name: product.name,
                                                meta: product.sku || undefined,
                                            };
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Search by product name or SKU
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {linkType === "collection" && (
                    <FormField
                        control={control}
                        name="linkedCollectionId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select Collection</FormLabel>
                                <FormControl>
                                    <SearchableCombobox
                                        value={field.value || undefined}
                                        onValueChange={(value) => field.onChange(value)}
                                        placeholder="Search and select a collection..."
                                        searchPlaceholder="Search collections..."
                                        emptyMessage="No collections found."
                                        onSearch={async (query, offset) => {
                                            const result = await searchCollections(query, 20, offset);
                                            return {
                                                data: result.data.map((c) => ({
                                                    id: c.id,
                                                    name: c.name,
                                                    meta: c.slug,
                                                })),
                                                hasMore: result.hasMore,
                                            };
                                        }}
                                        onGetById={async (id) => {
                                            const collection = await getCollectionById(id);
                                            if (!collection) return null;
                                            return {
                                                id: collection.id,
                                                name: collection.name,
                                                meta: collection.slug,
                                            };
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Search by collection name or slug
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {linkType === "external" && (
                    <FormField
                        control={control}
                        name="externalUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>External URL</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="https://example.com"
                                        {...field}
                                        value={field.value || ""}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Full URL including https://
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default LinkConfigurationCard;