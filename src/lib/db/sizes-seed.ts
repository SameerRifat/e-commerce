// src/lib/db/sizes-seed.ts
import { db } from "@/lib/db";
import { sizeCategories, sizes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface SeedSizeCategory {
    name: string;
    sizes: Array<{
        name: string;
        slug: string;
        sortOrder: number;
    }>;
}

// Pakistani market-specific size categories and sizes
const PAKISTANI_SIZE_CATEGORIES: SeedSizeCategory[] = [
    {
        name: "Clothing Sizes",
        sizes: [
            { name: "XS", slug: "xs", sortOrder: 1 },
            { name: "S", slug: "s", sortOrder: 2 },
            { name: "M", slug: "m", sortOrder: 3 },
            { name: "L", slug: "l", sortOrder: 4 },
            { name: "XL", slug: "xl", sortOrder: 5 },
            { name: "XXL", slug: "xxl", sortOrder: 6 },
            { name: "XXXL", slug: "xxxl", sortOrder: 7 },
            { name: "Free Size", slug: "free-size", sortOrder: 8 },
        ],
    },
    {
        name: "Pakistani Traditional Sizes",
        sizes: [
            { name: "36", slug: "size-36", sortOrder: 10 },
            { name: "38", slug: "size-38", sortOrder: 11 },
            { name: "40", slug: "size-40", sortOrder: 12 },
            { name: "42", slug: "size-42", sortOrder: 13 },
            { name: "44", slug: "size-44", sortOrder: 14 },
            { name: "46", slug: "size-46", sortOrder: 15 },
            { name: "48", slug: "size-48", sortOrder: 16 },
            { name: "50", slug: "size-50", sortOrder: 17 },
            { name: "52", slug: "size-52", sortOrder: 18 },
        ],
    },
    {
        name: "Skincare Volume",
        sizes: [
            { name: "5ml", slug: "5ml", sortOrder: 20 },
            { name: "10ml", slug: "10ml", sortOrder: 21 },
            { name: "15ml", slug: "15ml", sortOrder: 22 },
            { name: "20ml", slug: "20ml", sortOrder: 23 },
            { name: "25ml", slug: "25ml", sortOrder: 24 },
            { name: "30ml", slug: "30ml", sortOrder: 25 },
            { name: "50ml", slug: "50ml", sortOrder: 26 },
            { name: "75ml", slug: "75ml", sortOrder: 27 },
            { name: "100ml", slug: "100ml", sortOrder: 28 },
            { name: "125ml", slug: "125ml", sortOrder: 29 },
            { name: "150ml", slug: "150ml", sortOrder: 30 },
            { name: "200ml", slug: "200ml", sortOrder: 31 },
            { name: "250ml", slug: "250ml", sortOrder: 32 },
            { name: "300ml", slug: "300ml", sortOrder: 33 },
            { name: "500ml", slug: "500ml", sortOrder: 34 },
        ],
    },
    {
        name: "Makeup Volume",
        sizes: [
            { name: "1ml", slug: "1ml-makeup", sortOrder: 35 },
            { name: "2ml", slug: "2ml-makeup", sortOrder: 36 },
            { name: "3ml", slug: "3ml-makeup", sortOrder: 37 },
            { name: "4ml", slug: "4ml-makeup", sortOrder: 38 },
            { name: "5ml", slug: "5ml-makeup", sortOrder: 39 },
            { name: "6ml", slug: "6ml-makeup", sortOrder: 40 },
            { name: "8ml", slug: "8ml-makeup", sortOrder: 41 },
            { name: "10ml", slug: "10ml-makeup", sortOrder: 42 },
            { name: "12ml", slug: "12ml-makeup", sortOrder: 43 },
            { name: "15ml", slug: "15ml-makeup", sortOrder: 44 },
            { name: "18ml", slug: "18ml-makeup", sortOrder: 45 },
            { name: "20ml", slug: "20ml-makeup", sortOrder: 46 },
            { name: "25ml", slug: "25ml-makeup", sortOrder: 47 },
            { name: "30ml", slug: "30ml-makeup", sortOrder: 48 },
        ],
    },
    {
        name: "Fragrance Volume",
        sizes: [
            { name: "3ml", slug: "3ml-fragrance", sortOrder: 50 },
            { name: "6ml", slug: "6ml-fragrance", sortOrder: 51 },
            { name: "10ml", slug: "10ml-fragrance", sortOrder: 52 },
            { name: "12ml", slug: "12ml-fragrance", sortOrder: 53 },
            { name: "15ml", slug: "15ml-fragrance", sortOrder: 54 },
            { name: "20ml", slug: "20ml-fragrance", sortOrder: 55 },
            { name: "25ml", slug: "25ml-fragrance", sortOrder: 56 },
            { name: "30ml", slug: "30ml-fragrance", sortOrder: 57 },
            { name: "50ml", slug: "50ml-fragrance", sortOrder: 58 },
            { name: "75ml", slug: "75ml-fragrance", sortOrder: 59 },
            { name: "100ml", slug: "100ml-fragrance", sortOrder: 60 },
            { name: "125ml", slug: "125ml-fragrance", sortOrder: 61 },
        ],
    },
    {
        name: "Hair Care Volume",
        sizes: [
            { name: "50ml", slug: "50ml-hair", sortOrder: 65 },
            { name: "100ml", slug: "100ml-hair", sortOrder: 66 },
            { name: "150ml", slug: "150ml-hair", sortOrder: 67 },
            { name: "200ml", slug: "200ml-hair", sortOrder: 68 },
            { name: "250ml", slug: "250ml-hair", sortOrder: 69 },
            { name: "300ml", slug: "300ml-hair", sortOrder: 70 },
            { name: "350ml", slug: "350ml-hair", sortOrder: 71 },
            { name: "400ml", slug: "400ml-hair", sortOrder: 72 },
            { name: "500ml", slug: "500ml-hair", sortOrder: 73 },
            { name: "650ml", slug: "650ml-hair", sortOrder: 74 },
            { name: "750ml", slug: "750ml-hair", sortOrder: 75 },
            { name: "1L", slug: "1l-hair", sortOrder: 76 },
        ],
    },
    {
        name: "Product Weight",
        sizes: [
            { name: "5g", slug: "5g", sortOrder: 80 },
            { name: "10g", slug: "10g", sortOrder: 81 },
            { name: "15g", slug: "15g", sortOrder: 82 },
            { name: "20g", slug: "20g", sortOrder: 83 },
            { name: "25g", slug: "25g", sortOrder: 84 },
            { name: "30g", slug: "30g", sortOrder: 85 },
            { name: "40g", slug: "40g", sortOrder: 86 },
            { name: "50g", slug: "50g", sortOrder: 87 },
            { name: "75g", slug: "75g", sortOrder: 88 },
            { name: "100g", slug: "100g", sortOrder: 89 },
            { name: "125g", slug: "125g", sortOrder: 90 },
            { name: "150g", slug: "150g", sortOrder: 91 },
            { name: "200g", slug: "200g", sortOrder: 92 },
            { name: "250g", slug: "250g", sortOrder: 93 },
            { name: "300g", slug: "300g", sortOrder: 94 },
            { name: "400g", slug: "400g", sortOrder: 95 },
            { name: "500g", slug: "500g", sortOrder: 96 },
        ],
    },
    {
        name: "Shoe Sizes (Pakistani)",
        sizes: [
            { name: "35", slug: "shoe-35", sortOrder: 100 },
            { name: "36", slug: "shoe-36", sortOrder: 101 },
            { name: "37", slug: "shoe-37", sortOrder: 102 },
            { name: "38", slug: "shoe-38", sortOrder: 103 },
            { name: "39", slug: "shoe-39", sortOrder: 104 },
            { name: "40", slug: "shoe-40", sortOrder: 105 },
            { name: "41", slug: "shoe-41", sortOrder: 106 },
            { name: "42", slug: "shoe-42", sortOrder: 107 },
            { name: "43", slug: "shoe-43", sortOrder: 108 },
            { name: "44", slug: "shoe-44", sortOrder: 109 },
            { name: "45", slug: "shoe-45", sortOrder: 110 },
            { name: "46", slug: "shoe-46", sortOrder: 111 },
            { name: "47", slug: "shoe-47", sortOrder: 112 },
        ],
    },
    {
        name: "Travel & Sample Sizes",
        sizes: [
            { name: "Travel Size", slug: "travel-size", sortOrder: 115 },
            { name: "Sample Size", slug: "sample-size", sortOrder: 116 },
            { name: "Mini", slug: "mini", sortOrder: 117 },
            { name: "Deluxe Sample", slug: "deluxe-sample", sortOrder: 118 },
            { name: "Trial Size", slug: "trial-size", sortOrder: 119 },
            { name: "Tester", slug: "tester", sortOrder: 120 },
        ],
    },
    // {
    //     name: "Set Quantities",
    //     sizes: [
    //         { name: "Single", slug: "single", sortOrder: 125 },
    //         { name: "Pair", slug: "pair", sortOrder: 126 },
    //         { name: "Set of 3", slug: "set-of-3", sortOrder: 127 },
    //         { name: "Set of 4", slug: "set-of-4", sortOrder: 128 },
    //         { name: "Set of 5", slug: "set-of-5", sortOrder: 129 },
    //         { name: "Set of 6", slug: "set-of-6", sortOrder: 130 },
    //         { name: "Set of 10", slug: "set-of-10", sortOrder: 131 },
    //         { name: "Set of 12", slug: "set-of-12", sortOrder: 132 },
    //         { name: "Dozen", slug: "dozen", sortOrder: 133 },
    //     ],
    // },
];

/**
 * Seed the database with Pakistani market-specific size categories and sizes
 */
export async function seedSizes(): Promise<void> {
    console.log("🌱 Starting sizes seed for Pakistani market...");

    try {
        // Seed in a transaction for data consistency
        await db.transaction(async (tx) => {
            for (const categoryData of PAKISTANI_SIZE_CATEGORIES) {
                console.log(`📁 Creating category: ${categoryData.name}`);

                // Check if category already exists
                const existingCategory = await tx
                    .select({ id: sizeCategories.id })
                    .from(sizeCategories)
                    .where(eq(sizeCategories.name, categoryData.name))
                    .limit(1);

                let categoryId: string;

                if (existingCategory.length > 0) {
                    categoryId = existingCategory[0].id;
                    console.log(`   ✅ Category "${categoryData.name}" already exists`);
                } else {
                    const [newCategory] = await tx
                        .insert(sizeCategories)
                        .values({ name: categoryData.name })
                        .returning({ id: sizeCategories.id });
                    categoryId = newCategory.id;
                    console.log(`   ✨ Created new category: ${categoryData.name}`);
                }

                // Create sizes for this category
                for (const sizeData of categoryData.sizes) {
                    // Check if size already exists
                    const existingSize = await tx
                        .select({ id: sizes.id })
                        .from(sizes)
                        .where(eq(sizes.slug, sizeData.slug))
                        .limit(1);

                    if (existingSize.length === 0) {
                        await tx.insert(sizes).values({
                            name: sizeData.name,
                            slug: sizeData.slug,
                            sortOrder: sizeData.sortOrder,
                            categoryId: categoryId,
                        });
                        console.log(`   📏 Added size: ${sizeData.name}`);
                    } else {
                        console.log(`   ⏭️  Size "${sizeData.name}" already exists`);
                    }
                }
            }
        });

        console.log("✅ Sizes seed completed successfully!");
        console.log(`📊 Created ${PAKISTANI_SIZE_CATEGORIES.length} categories with sizes`);

        // Log summary
        const totalSizes = PAKISTANI_SIZE_CATEGORIES.reduce(
            (sum, category) => sum + category.sizes.length,
            0
        );
        console.log(`📊 Total sizes available: ${totalSizes}`);

    } catch (error) {
        console.error("❌ Error seeding sizes:", error);
        throw error;
    }
}

/**
 * Remove all seed data (for testing or reset purposes)
 */
export async function resetSizes(): Promise<void> {
    console.log("🧹 Resetting sizes data...");

    try {
        await db.transaction(async (tx) => {
            // Delete all sizes first (due to foreign key constraints)
            await tx.delete(sizes);
            console.log("   🗑️  Deleted all sizes");

            // Delete all size categories
            await tx.delete(sizeCategories);
            console.log("   🗑️  Deleted all size categories");
        });

        console.log("✅ Sizes reset completed successfully!");
    } catch (error) {
        console.error("❌ Error resetting sizes:", error);
        throw error;
    }
}

/**
 * Get seeding statistics
 */
export async function getSeedStats(): Promise<{
    totalCategories: number;
    totalSizes: number;
    categoryBreakdown: Array<{ name: string; sizeCount: number }>;
}> {
    try {
        // Get total counts
        const categoriesResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(sizeCategories);

        const sizesResult = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(sizes);

        // Get category breakdown
        const categoryBreakdown = await db
            .select({
                name: sizeCategories.name,
                sizeCount: sql<number>`cast(count(sizes.id) as integer)`.as('size_count'),
            })
            .from(sizeCategories)
            .leftJoin(sizes, eq(sizeCategories.id, sizes.categoryId))
            .groupBy(sizeCategories.id, sizeCategories.name)
            .orderBy(sizeCategories.name);

        return {
            totalCategories: categoriesResult[0]?.count || 0,
            totalSizes: sizesResult[0]?.count || 0,
            categoryBreakdown: categoryBreakdown.map(item => ({
                name: item.name,
                sizeCount: Number(item.sizeCount),
            })),
        };
    } catch (error) {
        console.error("Error getting seed stats:", error);
        return {
            totalCategories: 0,
            totalSizes: 0,
            categoryBreakdown: [],
        };
    }
}

// Import required SQL function for stats
import { sql } from "drizzle-orm";

// Export individual categories for selective seeding
export { PAKISTANI_SIZE_CATEGORIES };

/**
 * Seed only specific categories
 */
export async function seedSpecificCategories(categoryNames: string[]): Promise<void> {
    console.log(`🎯 Seeding specific categories: ${categoryNames.join(", ")}`);

    const categoriesToSeed = PAKISTANI_SIZE_CATEGORIES.filter(cat =>
        categoryNames.includes(cat.name)
    );

    if (categoriesToSeed.length === 0) {
        console.log("❌ No matching categories found");
        return;
    }

    try {
        await db.transaction(async (tx) => {
            for (const categoryData of categoriesToSeed) {
                console.log(`📁 Creating category: ${categoryData.name}`);

                // Check if category already exists
                const existingCategory = await tx
                    .select({ id: sizeCategories.id })
                    .from(sizeCategories)
                    .where(eq(sizeCategories.name, categoryData.name))
                    .limit(1);

                let categoryId: string;

                if (existingCategory.length > 0) {
                    categoryId = existingCategory[0].id;
                    console.log(`   ✅ Category "${categoryData.name}" already exists`);
                } else {
                    const [newCategory] = await tx
                        .insert(sizeCategories)
                        .values({ name: categoryData.name })
                        .returning({ id: sizeCategories.id });
                    categoryId = newCategory.id;
                    console.log(`   ✨ Created new category: ${categoryData.name}`);
                }

                // Create sizes for this category
                for (const sizeData of categoryData.sizes) {
                    const existingSize = await tx
                        .select({ id: sizes.id })
                        .from(sizes)
                        .where(eq(sizes.slug, sizeData.slug))
                        .limit(1);

                    if (existingSize.length === 0) {
                        await tx.insert(sizes).values({
                            name: sizeData.name,
                            slug: sizeData.slug,
                            sortOrder: sizeData.sortOrder,
                            categoryId: categoryId,
                        });
                        console.log(`   📏 Added size: ${sizeData.name}`);
                    }
                }
            }
        });

        console.log("✅ Selective category seeding completed!");
    } catch (error) {
        console.error("❌ Error seeding specific categories:", error);
        throw error;
    }
}

async function main() {
    try {
        await seedSizes();
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}