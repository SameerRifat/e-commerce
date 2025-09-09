// src/lib/actions/cart.ts - Simplified implementation following product.ts pattern
"use server";

import { db } from "@/lib/db";
import { carts, cartItems, productImages, guests, products, productVariants, colors, sizes } from "@/lib/db/schema";
import { getCurrentUser, guestSession, createGuestSession } from "@/lib/auth/actions";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Enhanced cart item type with full variant details
export interface CartItemWithDetails {
  id: string;
  cartId: string;
  productVariantId: string;
  quantity: number;
  variant: {
    id: string;
    sku: string;
    price: string;
    salePrice: string | null;
    inStock: number;
    product: {
      id: string;
      name: string;
      description: string;
    };
    color: {
      id: string;
      name: string;
      hexCode: string;
    };
    size: {
      id: string;
      name: string;
    };
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

// Get cart with all item details - simplified single query approach
export async function getCart(): Promise<{ items: CartItemWithDetails[]; total: number }> {
  try {
    const { cart } = await getOrCreateCart();

    // Single query with all joins - similar to getProduct() pattern
    const rows = await db
      .select({
        // Cart item fields
        cartItemId: cartItems.id,
        cartId: cartItems.cartId,
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,

        // Variant fields
        variantId: productVariants.id,
        variantSku: productVariants.sku,
        variantPrice: productVariants.price,
        variantSalePrice: productVariants.salePrice,
        variantInStock: productVariants.inStock,

        // Product fields
        productId: products.id,
        productName: products.name,
        productDescription: products.description,

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
      .innerJoin(productVariants, eq(productVariants.id, cartItems.productVariantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .innerJoin(colors, eq(colors.id, productVariants.colorId))
      .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .where(eq(cartItems.cartId, cart.id))
      .orderBy(desc(productImages.isPrimary), productImages.sortOrder);

    if (!rows.length) {
      return { items: [], total: 0 };
    }

    // Group results by cart item, similar to how getProduct() processes results
    const cartItemsMap = new Map<string, CartItemWithDetails>();
    
    for (const row of rows) {
      const cartItemId = row.cartItemId;
      
      if (!cartItemsMap.has(cartItemId)) {
        // Create new cart item
        cartItemsMap.set(cartItemId, {
          id: row.cartItemId,
          cartId: row.cartId,
          productVariantId: row.productVariantId,
          quantity: row.quantity,
          variant: {
            id: row.variantId,
            sku: row.variantSku,
            price: row.variantPrice,
            salePrice: row.variantSalePrice,
            inStock: row.variantInStock,
            product: {
              id: row.productId,
              name: row.productName,
              description: row.productDescription,
            },
            color: {
              id: row.colorId,
              name: row.colorName,
              hexCode: row.colorHexCode,
            },
            size: {
              id: row.sizeId,
              name: row.sizeName,
            },
            images: [],
          },
        });
      }

      // Add image to the cart item if it exists and not already added
      const cartItem = cartItemsMap.get(cartItemId)!;
      if (row.imageId && !cartItem.variant.images.some(img => img.id === row.imageId)) {
        cartItem.variant.images.push({
          id: row.imageId,
          url: row.imageUrl ?? '',
          isPrimary: row.imageIsPrimary ?? false,
        });
      }
    }

    const cartItemsWithDetails = Array.from(cartItemsMap.values());

    // Calculate total
    const total = cartItemsWithDetails.reduce((sum, item) => {
      const price = item.variant.salePrice ? parseFloat(item.variant.salePrice) : parseFloat(item.variant.price);
      return sum + (price * item.quantity);
    }, 0);

    console.log('[getCart] Cart items with details:', JSON.stringify(cartItemsWithDetails, null, 2));

    return { items: cartItemsWithDetails, total };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return { items: [], total: 0 };
  }
}

// Add item to cart
const addCartItemSchema = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

export async function addCartItem(data: z.infer<typeof addCartItemSchema>) {
  try {
    const validatedData = addCartItemSchema.parse(data);
    const { cart } = await getOrCreateCart();

    // Check if item already exists in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productVariantId, validatedData.productVariantId)
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
        productVariantId: validatedData.productVariantId,
        quantity: validatedData.quantity,
      });
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
      const existingUserItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, userCart.id),
          eq(cartItems.productVariantId, guestItem.productVariantId)
        ),
      });

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
          productVariantId: guestItem.productVariantId,
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