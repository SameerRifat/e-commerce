// src/lib/actions/cart.ts
"use server";

import { db } from "@/lib/db";
import { carts, cartItems, productImages, guests, products, productVariants, colors, sizes } from "@/lib/db/schema";
import { getCurrentUser, guestSession, createGuestSession } from "@/lib/auth/actions";
import { eq, and, or, asc, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Enhanced cart item type supporting both simple and configurable products
export interface CartItemWithDetails {
  id: string;
  cartId: string;
  productId: string | null;
  productVariantId: string | null;
  isSimpleProduct: boolean;
  quantity: number;
  // For simple products
  product?: {
    id: string;
    name: string;
    slug: string; // ADDED
    description: string;
    price: string;
    salePrice: string | null;
    sku: string;
    inStock: number;
    images: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
    }>;
  };
  // For configurable products
  variant?: {
    id: string;
    sku: string;
    price: string;
    salePrice: string | null;
    inStock: number;
    product: {
      id: string;
      name: string;
      slug: string; // ADDED
      description: string;
    };
    color: {
      id: string;
      name: string;
      hexCode: string;
    } | null;
    size: {
      id: string;
      name: string;
    } | null;
    images: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
    }>;
  };
}

// Get or create cart for current user/guest
async function getOrCreateCart() {
  const user = await getCurrentUser();

  if (user) {
    // User is authenticated - get or create user cart
    let cart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
    });

    if (!cart) {
      const [newCart] = await db.insert(carts).values({
        userId: user.id,
      }).returning();
      cart = newCart;
    }

    return { cart, isGuest: false };
  } else {
    // Guest user - get or create guest session and cart
    let { sessionToken } = await guestSession();

    if (!sessionToken) {
      const result = await createGuestSession();
      sessionToken = result.sessionToken;
    }

    // Find guest record by session token
    const guest = await db.query.guests.findFirst({
      where: eq(guests.sessionToken, sessionToken),
    });

    if (!guest) {
      throw new Error("Failed to create guest session");
    }

    let cart = await db.query.carts.findFirst({
      where: eq(carts.guestId, guest.id),
    });

    if (!cart) {
      const [newCart] = await db.insert(carts).values({
        guestId: guest.id,
      }).returning();
      cart = newCart;
    }

    return { cart, isGuest: true };
  }
}

// Get cart with all item details - handles both simple and configurable products
// Industry Pattern: Single query with JOINs (WooCommerce, Shopify, Magento approach)
// Benefits: Eliminates N+1 query problem, faster performance, cleaner code
export async function getCart(): Promise<{ items: CartItemWithDetails[]; total: number }> {
  try {
    const { cart } = await getOrCreateCart();

    // Single optimized query with all necessary JOINs
    // Follows same pattern as getProductBySlug for consistency
    const rows = await db
      .select({
        // Cart item fields
        cartItemId: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        productVariantId: cartItems.productVariantId,
        isSimpleProduct: cartItems.isSimpleProduct,
        quantity: cartItems.quantity,

        // Product fields (for simple products and parent of configurable)
        productName: products.name,
        productSlug: products.slug,
        productDescription: products.description,
        productPrice: products.price,
        productSalePrice: products.salePrice,
        productSku: products.sku,
        productInStock: products.inStock,

        // Variant fields (for configurable products)
        variantId: productVariants.id,
        variantSku: productVariants.sku,
        variantPrice: productVariants.price,
        variantSalePrice: productVariants.salePrice,
        variantInStock: productVariants.inStock,

        // Color fields
        colorId: colors.id,
        colorName: colors.name,
        colorHexCode: colors.hexCode,

        // Size fields
        sizeId: sizes.id,
        sizeName: sizes.name,

        // Image fields
        imageId: productImages.id,
        imageUrl: productImages.url,
        imageIsPrimary: productImages.isPrimary,
        imageSortOrder: productImages.sortOrder,
        imageVariantId: productImages.variantId,
      })
      .from(cartItems)
      .leftJoin(products, eq(products.id, cartItems.productId))
      .leftJoin(productVariants, eq(productVariants.id, cartItems.productVariantId))
      .leftJoin(colors, eq(colors.id, productVariants.colorId))
      .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .leftJoin(productImages,
        or(
          // For simple products: product-level images only
          and(
            eq(productImages.productId, products.id),
            sql`${cartItems.isSimpleProduct} = true`,
            sql`${productImages.variantId} IS NULL`
          ),
          // For configurable products: variant-specific or product-level images
          and(
            eq(productImages.productId, products.id),
            sql`${cartItems.isSimpleProduct} = false`,
            or(
              eq(productImages.variantId, productVariants.id),
              sql`${productImages.variantId} IS NULL`
            )
          )
        )
      )
      .where(eq(cartItems.cartId, cart.id))
      .orderBy(
        asc(cartItems.id),
        desc(productImages.isPrimary),
        asc(productImages.sortOrder)
      );

    if (!rows.length) {
      return { items: [], total: 0 };
    }

    // Group rows by cart item and build result
    const cartItemsMap = new Map<string, CartItemWithDetails>();
    const imagesMap = new Map<string, Array<{ id: string; url: string; isPrimary: boolean }>>();

    for (const row of rows) {
      const cartItemId = row.cartItemId;

      // Build cart item if not yet created
      if (!cartItemsMap.has(cartItemId)) {
        if (row.isSimpleProduct) {
          // Simple product
          cartItemsMap.set(cartItemId, {
            id: cartItemId,
            cartId: row.cartId,
            productId: row.productId,
            productVariantId: null,
            isSimpleProduct: true,
            quantity: row.quantity,
            product: {
              id: row.productId!,
              name: row.productName!,
              slug: row.productSlug!,
              description: row.productDescription!,
              price: row.productPrice || "0",
              salePrice: row.productSalePrice,
              sku: row.productSku || "",
              inStock: row.productInStock || 0,
              images: [], // Will be populated below
            },
          });
          imagesMap.set(cartItemId, []);
        } else {
          // Configurable product
          cartItemsMap.set(cartItemId, {
            id: cartItemId,
            cartId: row.cartId,
            productId: row.productId,
            productVariantId: row.productVariantId,
            isSimpleProduct: false,
            quantity: row.quantity,
            variant: {
              id: row.variantId!,
              sku: row.variantSku!,
              price: row.variantPrice || "0",
              salePrice: row.variantSalePrice,
              inStock: row.variantInStock || 0,
              product: {
                id: row.productId!,
                name: row.productName!,
                slug: row.productSlug!,
                description: row.productDescription!,
              },
              color: row.colorId ? {
                id: row.colorId,
                name: row.colorName!,
                hexCode: row.colorHexCode!,
              } : null,
              size: row.sizeId ? {
                id: row.sizeId,
                name: row.sizeName!,
              } : null,
              images: [], // Will be populated below
            },
          });
          imagesMap.set(cartItemId, []);
        }
      }

      // Add image if exists and not already added
      if (row.imageId && row.imageUrl) {
        const images = imagesMap.get(cartItemId)!;
        if (!images.some(img => img.id === row.imageId)) {
          images.push({
            id: row.imageId,
            url: row.imageUrl,
            isPrimary: row.imageIsPrimary || false,
          });
        }
      }
    }

    // Populate images into cart items
    for (const [cartItemId, item] of cartItemsMap.entries()) {
      const images = imagesMap.get(cartItemId) || [];

      // Sort images: variant-specific first, then product-level, prioritize isPrimary
      const sortedImages = images.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });

      if (item.product) {
        item.product.images = sortedImages;
      } else if (item.variant) {
        item.variant.images = sortedImages;
      }
    }

    const cartItemsWithDetails = Array.from(cartItemsMap.values());

    // Calculate total
    const total = cartItemsWithDetails.reduce((sum, item) => {
      if (item.isSimpleProduct && item.product) {
        const price = item.product.salePrice ? parseFloat(item.product.salePrice) : parseFloat(item.product.price);
        return sum + (price * item.quantity);
      } else if (!item.isSimpleProduct && item.variant) {
        const price = item.variant.salePrice ? parseFloat(item.variant.salePrice) : parseFloat(item.variant.price);
        return sum + (price * item.quantity);
      }
      return sum;
    }, 0);

    return { items: cartItemsWithDetails, total };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return { items: [], total: 0 };
  }
}

// Add item to cart - supports both simple and configurable products
const addCartItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productVariantId: z.string().uuid().optional(),
  isSimpleProduct: z.boolean().default(false),
  quantity: z.number().int().min(1).default(1),
}).refine(
  (data) => {
    // For simple products: productId must be provided, productVariantId must not be provided
    if (data.isSimpleProduct) {
      return data.productId && !data.productVariantId;
    }
    // For configurable products: both productId and productVariantId should be provided
    else {
      return data.productId && data.productVariantId;
    }
  },
  {
    message: "For simple products, provide productId only. For configurable products, provide both productId and productVariantId.",
  }
);

export async function addCartItem(data: z.infer<typeof addCartItemSchema>) {
  try {
    const validatedData = addCartItemSchema.parse(data);
    const { cart } = await getOrCreateCart();

    if (validatedData.isSimpleProduct && validatedData.productId) {
      // Handle simple product
      const existingItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, validatedData.productId),
          eq(cartItems.isSimpleProduct, true)
        ),
      });

      if (existingItem) {
        // Update quantity if item exists
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + validatedData.quantity })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        // Add new item
        await db.insert(cartItems).values({
          cartId: cart.id,
          productId: validatedData.productId,
          productVariantId: null,
          isSimpleProduct: true,
          quantity: validatedData.quantity,
        });
      }
    } else if (!validatedData.isSimpleProduct && validatedData.productVariantId && validatedData.productId) {
      // Handle configurable product variant
      const existingItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productVariantId, validatedData.productVariantId),
          eq(cartItems.isSimpleProduct, false)
        ),
      });

      if (existingItem) {
        // Update quantity if item exists
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + validatedData.quantity })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        // Add new item with productId
        await db.insert(cartItems).values({
          cartId: cart.id,
          productId: validatedData.productId,
          productVariantId: validatedData.productVariantId,
          isSimpleProduct: false,
          quantity: validatedData.quantity,
        });
      }
    } else {
      return { success: false, error: "Invalid product data provided" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return { success: false, error: "Failed to add item to cart" };
  }
}

// Update cart item quantity
const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export async function updateCartItem(data: z.infer<typeof updateCartItemSchema>) {
  try {
    const validatedData = updateCartItemSchema.parse(data);
    const { cart } = await getOrCreateCart();

    // Verify the cart item belongs to the current user/guest cart
    const cartItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, validatedData.cartItemId),
        eq(cartItems.cartId, cart.id)
      ),
    });

    if (!cartItem) {
      return { success: false, error: "Cart item not found" };
    }

    await db
      .update(cartItems)
      .set({ quantity: validatedData.quantity })
      .where(eq(cartItems.id, validatedData.cartItemId));

    return { success: true };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return { success: false, error: "Failed to update cart item" };
  }
}

// Remove item from cart
const removeCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
});

export async function removeCartItem(data: z.infer<typeof removeCartItemSchema>) {
  try {
    const validatedData = removeCartItemSchema.parse(data);
    const { cart } = await getOrCreateCart();

    // Verify the cart item belongs to the current user/guest cart
    const cartItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.id, validatedData.cartItemId),
        eq(cartItems.cartId, cart.id)
      ),
    });

    if (!cartItem) {
      return { success: false, error: "Cart item not found" };
    }

    await db.delete(cartItems).where(eq(cartItems.id, validatedData.cartItemId));

    return { success: true };
  } catch (error) {
    console.error("Error removing cart item:", error);
    return { success: false, error: "Failed to remove cart item" };
  }
}

// Clear entire cart
export async function clearCart() {
  try {
    const { cart } = await getOrCreateCart();

    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false, error: "Failed to clear cart" };
  }
}

// Merge guest cart with user cart (called during login/signup)
export async function mergeGuestCartWithUserCart(userId: string, guestSessionToken: string) {
  try {
    // Find guest cart
    const guest = await db.query.guests.findFirst({
      where: eq(guests.sessionToken, guestSessionToken),
    });

    if (!guest) return { success: true }; // No guest cart to merge

    const guestCart = await db.query.carts.findFirst({
      where: eq(carts.guestId, guest.id),
      with: {
        items: true,
      },
    });

    if (!guestCart || !guestCart.items.length) {
      return { success: true }; // No items to merge
    }

    // Get or create user cart
    let userCart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
    });

    if (!userCart) {
      const [newCart] = await db.insert(carts).values({
        userId,
      }).returning();
      userCart = newCart;
    }

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      let existingUserItem;

      if (guestItem.isSimpleProduct && guestItem.productId) {
        existingUserItem = await db.query.cartItems.findFirst({
          where: and(
            eq(cartItems.cartId, userCart.id),
            eq(cartItems.productId, guestItem.productId),
            eq(cartItems.isSimpleProduct, true)
          ),
        });
      } else if (!guestItem.isSimpleProduct && guestItem.productVariantId) {
        existingUserItem = await db.query.cartItems.findFirst({
          where: and(
            eq(cartItems.cartId, userCart.id),
            eq(cartItems.productVariantId, guestItem.productVariantId),
            eq(cartItems.isSimpleProduct, false)
          ),
        });
      }

      if (existingUserItem) {
        // Update quantity if item exists in user cart
        await db
          .update(cartItems)
          .set({ quantity: existingUserItem.quantity + guestItem.quantity })
          .where(eq(cartItems.id, existingUserItem.id));
      } else {
        // Add new item to user cart
        await db.insert(cartItems).values({
          cartId: userCart.id,
          productId: guestItem.productId,
          productVariantId: guestItem.productVariantId,
          isSimpleProduct: guestItem.isSimpleProduct,
          quantity: guestItem.quantity,
        });
      }
    }

    // Clean up guest cart
    await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
    await db.delete(carts).where(eq(carts.id, guestCart.id));

    return { success: true };
  } catch (error) {
    console.error("Error merging guest cart with user cart:", error);
    return { success: false, error: "Failed to merge carts" };
  }
}