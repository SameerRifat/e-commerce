// src/lib/db/seed.ts
import { db } from '@/lib/db';
import {
  genders, colors, sizes, brands, categories, collections, productCollections,
  products, productVariants, productImages,
  insertGenderSchema, insertColorSchema, insertSizeSchema, insertBrandSchema,
  insertCategorySchema, insertCollectionSchema, insertProductSchema, insertVariantSchema, insertProductImageSchema,
  type InsertProduct, type InsertVariant, type InsertProductImage,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

type ProductRow = typeof products.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;

const log = (...args: unknown[]) => console.log('[seed]', ...args);
const err = (...args: unknown[]) => console.error('[seed:error]', ...args);

function pick<T>(arr: T[], n: number) {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Download image from URL and save to local path
async function downloadImage(url: string, localPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    writeFileSync(localPath, new Uint8Array(buffer));
    log(`Downloaded: ${url} -> ${localPath}`);
    return true;
  } catch (error) {
    err(`Failed to download ${url}:`, error);
    return false;
  }
}

async function seed() {
  try {
    log('Seeding filters: genders, colors, sizes for cosmetics');

    // Gender categories for cosmetics
    const genderRows = [
      insertGenderSchema.parse({ label: 'Women', slug: 'women' }),
      insertGenderSchema.parse({ label: 'Men', slug: 'men' }),
      insertGenderSchema.parse({ label: 'Unisex', slug: 'unisex' }),
    ];
    for (const row of genderRows) {
      const exists = await db.select().from(genders).where(eq(genders.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(genders).values(row);
    }

    // Color variants for cosmetics (shades)
    const colorRows = [
      { name: 'Fair', slug: 'fair', hexCode: '#F7E7CE' },
      { name: 'Light', slug: 'light', hexCode: '#F1C27D' },
      { name: 'Medium', slug: 'medium', hexCode: '#E0AC69' },
      { name: 'Tan', slug: 'tan', hexCode: '#C68642' },
      { name: 'Deep', slug: 'deep', hexCode: '#8D5524' },
      { name: 'Rose Gold', slug: 'rose-gold', hexCode: '#E8B4B8' },
      { name: 'Nude Pink', slug: 'nude-pink', hexCode: '#D4A5A5' },
      { name: 'Berry', slug: 'berry', hexCode: '#8E4162' },
      { name: 'Coral', slug: 'coral', hexCode: '#FF6B6B' },
      { name: 'Ruby Red', slug: 'ruby-red', hexCode: '#C41E3A' },
      { name: 'Clear', slug: 'clear', hexCode: '#FFFFFF' },
    ].map((c) => insertColorSchema.parse(c));

    for (const row of colorRows) {
      const exists = await db.select().from(colors).where(eq(colors.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(colors).values(row);
    }

    // Sizes for cosmetics (volumes/weights)
    const sizeRows = [
      { name: '5ml', slug: '5ml', sortOrder: 0 },
      { name: '10ml', slug: '10ml', sortOrder: 1 },
      { name: '15ml', slug: '15ml', sortOrder: 2 },
      { name: '30ml', slug: '30ml', sortOrder: 3 },
      { name: '50ml', slug: '50ml', sortOrder: 4 },
      { name: '100ml', slug: '100ml', sortOrder: 5 },
      { name: '150ml', slug: '150ml', sortOrder: 6 },
      { name: '250ml', slug: '250ml', sortOrder: 7 },
      { name: '3g', slug: '3g', sortOrder: 8 },
      { name: '5g', slug: '5g', sortOrder: 9 },
      { name: '10g', slug: '10g', sortOrder: 10 },
    ].map((s) => insertSizeSchema.parse(s));

    for (const row of sizeRows) {
      const exists = await db.select().from(sizes).where(eq(sizes.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(sizes).values(row);
    }

    log('Seeding popular cosmetic brands in Pakistan');
    const brandRows = [
      { name: 'Masarrat Misbah', slug: 'masarrat-misbah', logoUrl: null },
      { name: 'Rivaj UK', slug: 'rivaj-uk', logoUrl: null },
      { name: 'BBA by Suleman', slug: 'bba-suleman', logoUrl: null },
      { name: 'Flormar', slug: 'flormar', logoUrl: null },
      { name: 'Her Beauty', slug: 'her-beauty', logoUrl: null },
      { name: 'Conatural', slug: 'conatural', logoUrl: null },
      { name: 'Medora', slug: 'medora', logoUrl: null },
      { name: 'J.', slug: 'j-dot', logoUrl: null },
    ];

    for (const brand of brandRows) {
      const brandData = insertBrandSchema.parse(brand);
      const exists = await db.select().from(brands).where(eq(brands.slug, brandData.slug)).limit(1);
      if (!exists.length) await db.insert(brands).values(brandData);
    }

    log('Seeding cosmetic categories');
    const catRows = [
      { name: 'Skincare', slug: 'skincare', parentId: null },
      { name: 'Makeup', slug: 'makeup', parentId: null },
      { name: 'Haircare', slug: 'haircare', parentId: null },
      { name: 'Fragrances', slug: 'fragrances', parentId: null },
      { name: 'Face Care', slug: 'face-care', parentId: null },
      { name: 'Moisturizers', slug: 'moisturizers', parentId: null },
      { name: 'Serums', slug: 'serums', parentId: null },
      { name: 'Cleansers', slug: 'cleansers', parentId: null },
      { name: 'Foundation', slug: 'foundation', parentId: null },
      { name: 'Lipstick', slug: 'lipstick', parentId: null },
      { name: 'Eyeshadow', slug: 'eyeshadow', parentId: null },
      { name: 'Shampoo', slug: 'shampoo', parentId: null },
      { name: 'Hair Oil', slug: 'hair-oil', parentId: null },
    ].map((c) => insertCategorySchema.parse(c));

    for (const row of catRows) {
      const exists = await db.select().from(categories).where(eq(categories.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(categories).values(row);
    }

    // Add parent-child relationships for categories
    const skincareCat = (await db.select().from(categories).where(eq(categories.slug, 'skincare')))[0];
    const makeupCat = (await db.select().from(categories).where(eq(categories.slug, 'makeup')))[0];
    const haircareCat = (await db.select().from(categories).where(eq(categories.slug, 'haircare')))[0];

    // Update subcategories with parent IDs
    await db.update(categories)
      .set({ parentId: skincareCat.id })
      .where(eq(categories.slug, 'face-care'));
    await db.update(categories)
      .set({ parentId: skincareCat.id })
      .where(eq(categories.slug, 'moisturizers'));
    await db.update(categories)
      .set({ parentId: skincareCat.id })
      .where(eq(categories.slug, 'serums'));
    await db.update(categories)
      .set({ parentId: skincareCat.id })
      .where(eq(categories.slug, 'cleansers'));
    
    await db.update(categories)
      .set({ parentId: makeupCat.id })
      .where(eq(categories.slug, 'foundation'));
    await db.update(categories)
      .set({ parentId: makeupCat.id })
      .where(eq(categories.slug, 'lipstick'));
    await db.update(categories)
      .set({ parentId: makeupCat.id })
      .where(eq(categories.slug, 'eyeshadow'));
    
    await db.update(categories)
      .set({ parentId: haircareCat.id })
      .where(eq(categories.slug, 'shampoo'));
    await db.update(categories)
      .set({ parentId: haircareCat.id })
      .where(eq(categories.slug, 'hair-oil'));

    log('Seeding collections');
    const collectionRows = [
      insertCollectionSchema.parse({ name: 'Summer Glow 2025', slug: 'summer-glow-2025' }),
      insertCollectionSchema.parse({ name: 'New Arrivals', slug: 'new-arrivals' }),
      insertCollectionSchema.parse({ name: 'Best Sellers', slug: 'best-sellers' }),
      insertCollectionSchema.parse({ name: 'Bridal Collection', slug: 'bridal-collection' }),
    ];

    for (const row of collectionRows) {
      const exists = await db.select().from(collections).where(eq(collections.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(collections).values(row);
    }

    // Get all data for product creation
    const allGenders = await db.select().from(genders);
    const allColors = await db.select().from(colors);
    const allSizes = await db.select().from(sizes);
    const allBrands = await db.select().from(brands);
    const allCategories = await db.select().from(categories);
    const allCollections = await db.select().from(collections);

    // Create uploads directory
    const uploadsRoot = join(process.cwd(), 'static', 'uploads', 'cosmetics');
    if (!existsSync(uploadsRoot)) {
      mkdirSync(uploadsRoot, { recursive: true });
    }

    // Authentic Pakistani cosmetic products with real images
    const cosmeticProducts = [
      {
        name: 'Glass Skin Moisturizer',
        brand: 'Her Beauty',
        category: 'moisturizers',
        description: 'Achieve that coveted glass skin look with our hydrating moisturizer enriched with hyaluronic acid and niacinamide.',
        gender: 'women',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop',
        colors: ['clear'],
        sizes: ['30ml', '50ml'],
        basePrice: 1200
      },
      {
        name: 'Vitamin C Face Serum',
        brand: 'Conatural',
        category: 'serums',
        description: 'Brighten your skin with our potent Vitamin C serum. Perfect for Pakistani climate and skin tones.',
        gender: 'unisex',
        imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800&h=800&fit=crop',
        colors: ['clear'],
        sizes: ['15ml', '30ml'],
        basePrice: 1800
      },
      {
        name: 'Matte Liquid Foundation',
        brand: 'Masarrat Misbah',
        category: 'foundation',
        description: 'Long-lasting matte foundation perfect for Pakistani skin tones. Oil-free and buildable coverage.',
        gender: 'women',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop',
        colors: ['fair', 'light', 'medium', 'tan', 'deep'],
        sizes: ['30ml'],
        basePrice: 2500
      },
      {
        name: 'Rose Gold Highlighter',
        brand: 'BBA by Suleman',
        category: 'makeup',
        description: 'Illuminate your features with our signature rose gold highlighter. Blends seamlessly for a natural glow.',
        gender: 'women',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop',
        colors: ['rose-gold'],
        sizes: ['10g'],
        basePrice: 1500
      },
      {
        name: 'Matte Lipstick Collection',
        brand: 'Rivaj UK',
        category: 'lipstick',
        description: 'Long-wearing matte lipstick with intense color payoff. Available in trending Pakistani favorite shades.',
        gender: 'women',
        imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=800&fit=crop',
        colors: ['nude-pink', 'berry', 'coral', 'ruby-red'],
        sizes: ['3g'],
        basePrice: 800
      },
      {
        name: 'Gentle Face Cleanser',
        brand: 'Her Beauty',
        category: 'cleansers',
        description: 'Gentle daily cleanser suitable for all skin types. Removes makeup and impurities without stripping natural oils.',
        gender: 'unisex',
        imageUrl: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=800&fit=crop',
        colors: ['clear'],
        sizes: ['100ml', '150ml'],
        basePrice: 900
      },
      {
        name: 'Argan Hair Oil',
        brand: 'Conatural',
        category: 'hair-oil',
        description: 'Pure argan oil for nourishing and strengthening hair. Perfect for dry and damaged hair common in Pakistani climate.',
        gender: 'unisex',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop',
        colors: ['clear'],
        sizes: ['50ml', '100ml'],
        basePrice: 1400
      },
      {
        name: 'Keratin Shampoo',
        brand: 'Medora',
        category: 'shampoo',
        description: 'Strengthening shampoo infused with keratin. Repairs and protects hair from environmental damage.',
        gender: 'unisex',
        imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
        colors: ['clear'],
        sizes: ['250ml'],
        basePrice: 1100
      },
      {
        name: 'Eyeshadow Palette - Desert Rose',
        brand: 'Flormar',
        category: 'eyeshadow',
        description: 'Turkish quality eyeshadow palette with warm tones perfect for Pakistani skin undertones.',
        gender: 'women',
        imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=800&fit=crop',
        colors: ['rose-gold', 'berry', 'nude-pink'],
        sizes: ['15g'],
        basePrice: 3200
      },
      {
        name: 'Hyaluronic Acid Serum',
        brand: 'J.',
        category: 'serums',
        description: 'Deep hydration serum with hyaluronic acid. Plumps skin and reduces fine lines for youthful appearance.',
        gender: 'unisex',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop',
        colors: ['clear'],
        sizes: ['15ml', '30ml'],
        basePrice: 2200
      },
      {
        name: 'CC Cream with SPF 30',
        brand: 'Masarrat Misbah',
        category: 'face-care',
        description: 'Color correcting cream with sun protection. Perfect for daily wear in Pakistani sun.',
        gender: 'women',
        imageUrl: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=800&fit=crop',
        colors: ['fair', 'light', 'medium'],
        sizes: ['30ml', '50ml'],
        basePrice: 1800
      },
      {
        name: 'Rose Water Toner',
        brand: 'Conatural',
        category: 'skincare',
        description: 'Pure rose water toner that refreshes and balances skin pH. Made with Pakistani roses.',
        gender: 'unisex',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=800&fit=crop',
        colors: ['clear'],
        sizes: ['100ml', '150ml'],
        basePrice: 700
      }
    ];

    log(`Creating ${cosmeticProducts.length} cosmetic products with variants and images`);

    for (let i = 0; i < cosmeticProducts.length; i++) {
      const productData = cosmeticProducts[i];
      
      // Find related entities
      const brand = allBrands.find(b => b.slug === productData.brand.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-dot'));
      const category = allCategories.find(c => c.slug === productData.category);
      const gender = allGenders.find(g => g.slug === productData.gender);
      
      if (!brand || !category || !gender) {
        err(`Missing data for product ${productData.name}`);
        continue;
      }

      const product = insertProductSchema.parse({
        name: productData.name,
        description: productData.description,
        categoryId: category.id,
        genderId: gender.id,
        brandId: brand.id,
        isPublished: true,
      });

      const retP = await db.insert(products).values(product as InsertProduct).returning();
      const insertedProduct = (retP as ProductRow[])[0];

      // Create variants for available colors and sizes
      const availableColors = allColors.filter(c => productData.colors.includes(c.slug));
      const availableSizes = allSizes.filter(s => productData.sizes.includes(s.slug));

      const variantIds: string[] = [];
      let defaultVariantId: string | null = null;

      for (const color of availableColors) {
        for (const size of availableSizes) {
          const priceMultiplier = size.name.includes('ml') ? 
            (parseInt(size.name) / 30) : // Base on 30ml
            (parseInt(size.name) / 10);  // Base on 10g
          
          const adjustedPrice = Math.round(productData.basePrice * Math.max(0.8, Math.min(2.0, priceMultiplier)));
          const discountedPrice = Math.random() < 0.25 ? Math.round(adjustedPrice * 0.85) : null;

          const sku = `${brand.slug.toUpperCase()}-${insertedProduct.id.slice(0, 6)}-${color.slug.toUpperCase()}-${size.slug.toUpperCase()}`;
          
          const variant = insertVariantSchema.parse({
            productId: insertedProduct.id,
            sku: sku.replace(/[^A-Z0-9\-]/g, ''),
            price: adjustedPrice.toFixed(2),
            salePrice: discountedPrice ? discountedPrice.toFixed(2) : undefined,
            colorId: color.id,
            sizeId: size.id,
            inStock: randInt(10, 100),
            weight: size.name.includes('ml') ? 
              parseFloat(size.name.replace('ml', '')) / 1000 :
              parseFloat(size.name.replace('g', '')) / 1000,
            dimensions: { length: 5, width: 5, height: 10 },
          });

          const retV = await db.insert(productVariants).values(variant as InsertVariant).returning();
          const createdVariant = (retV as VariantRow[])[0];
          variantIds.push(createdVariant.id);
          
          if (!defaultVariantId) defaultVariantId = createdVariant.id;
        }
      }

      // Set default variant
      if (defaultVariantId) {
        await db.update(products).set({ defaultVariantId }).where(eq(products.id, insertedProduct.id));
      }

      // Download and save product image
      const imageExtension = productData.imageUrl.includes('.jpg') ? 'jpg' : 'png';
      const imageName = `${insertedProduct.id}-main.${imageExtension}`;
      const imagePath = join(uploadsRoot, imageName);
      
      const imageDownloaded = await downloadImage(productData.imageUrl, imagePath);
      
      if (imageDownloaded) {
        const img: InsertProductImage = insertProductImageSchema.parse({
          productId: insertedProduct.id,
          url: `/static/uploads/cosmetics/${imageName}`,
          sortOrder: 0,
          isPrimary: true,
        });
        await db.insert(productImages).values(img);
      }

      // Assign to collections randomly
      const selectedCollections = pick(allCollections, randInt(1, 2));
      for (const collection of selectedCollections) {
        await db.insert(productCollections).values({
          productId: insertedProduct.id,
          collectionId: collection.id,
        });
      }

      log(`✓ Seeded ${productData.name} by ${productData.brand} with ${variantIds.length} variants`);
    }

    log('🎉 Cosmetics seeding complete! Created authentic Pakistani cosmetic products.');
  } catch (e) {
    err('Seeding failed:', e);
    process.exitCode = 1;
  }
}

seed();