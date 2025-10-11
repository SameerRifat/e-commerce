// src/components/dashboard/hero-slides/hooks/use-link-type-effect.ts
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { HeroSlideFormData } from "../hero-slide-form-schema";

export const useLinkTypeEffect = (
    linkType: "product" | "collection" | "external" | "none",
    form: UseFormReturn<HeroSlideFormData>
) => {
    useEffect(() => {
        if (linkType !== "product") {
            form.setValue("linkedProductId", null);
            form.clearErrors("linkedProductId");
        }
        if (linkType !== "collection") {
            form.setValue("linkedCollectionId", null);
            form.clearErrors("linkedCollectionId");
        }
        if (linkType !== "external") {
            form.setValue("externalUrl", "");
            form.clearErrors("externalUrl");
        }
    }, [linkType, form]);
};