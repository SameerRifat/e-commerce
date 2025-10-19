// src/app/(root)/_components/categories-section-data.tsx
import { getHomepageCategories } from "@/lib/actions/homepage-categories";
import CategoriesSection from "@/components/home/categories-section";

export async function CategoriesSectionData() {
    const categories = await getHomepageCategories();
    return <CategoriesSection categories={categories} />;
}