// src/components/dashboard/hero-slides/form-sections/basic-information-card.tsx
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HeroSlideFormData } from "../hero-slide-form-schema";

interface BasicInformationCardProps {
    control: Control<HeroSlideFormData>;
}

const BasicInformationCard: React.FC<BasicInformationCardProps> = ({ control }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Internal Title (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Summer Sale 2024" {...field} />
                            </FormControl>
                            <FormDescription>
                                For internal reference only, not visible to customers
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="altText"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Alt Text</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Describe the slide content..."
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                For accessibility and SEO (max 200 characters)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Internal notes about this slide..."
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Internal notes for admins (max 500 characters)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="isPublished"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Publish Slide</FormLabel>
                                <FormDescription>
                                    Make this slide visible on the homepage
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
            </CardContent>
        </Card>
    );
};

export default BasicInformationCard;