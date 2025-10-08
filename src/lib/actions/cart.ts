// src/lib/actions/cart.ts
"use server";

import { db } from "@/lib/db";
import { carts, cartItems, productImages, guests, products, productVariants, colors, sizes } from "@/lib/db/schema";
import { getCurrentUser, guestSession, createGuestSession } from "@/lib/auth/actions";
import { eq, and, desc, sql } from "drizzle-orm";
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
export async function getCart(): Promise<{ items: CartItemWithDetails[]; total: number }> {
  try {
    const { cart } = await getOrCreateCart();

    // Get all cart items
    const cartItemsData = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        productVariantId: cartItems.productVariantId,
        isSimpleProduct: cartItems.isSimpleProduct,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    if (!cartItemsData.length) {
      return { items: [], total: 0 };
    }

    const cartItemsWithDetails: CartItemWithDetails[] = [];

    for (const cartItem of cartItemsData) {
      if (cartItem.isSimpleProduct && cartItem.productId) {
        // Handle simple product
        const productData = await db
          .select({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            salePrice: products.salePrice,
            sku: products.sku,
            inStock: products.inStock,
          })
          .from(products)
          .where(eq(products.id, cartItem.productId))
          .limit(1);

        if (!productData.length) continue;

        const product = productData[0];

        // Get product images
        const productImagesData = await db
          .select({
            id: productImages.id,
            url: productImages.url,
            isPrimary: productImages.isPrimary,
          })
          .from(productImages)
          .where(and(
            eq(productImages.productId, product.id),
            sql`${productImages.variantId} IS NULL` // Only product-level images for simple products
          ))
          .orderBy(desc(productImages.isPrimary), productImages.sortOrder);

        cartItemsWithDetails.push({
          id: cartItem.id,
          cartId: cartItem.cartId,
          productId: cartItem.productId,
          productVariantId: null,
          isSimpleProduct: true,
          quantity: cartItem.quantity,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price || "0",
            salePrice: product.salePrice,
            sku: product.sku || "",
            inStock: product.inStock || 0,
            images: productImagesData.map(img => ({
              id: img.id,
              url: img.url,
              isPrimary: img.isPrimary || false,
            })),
          },
        });
      } else if (!cartItem.isSimpleProduct && cartItem.productVariantId) {
        // Handle configurable product variant
        const variantData = await db
          .select({
            // Variant fields
            variantId: productVariants.id,
            variantSku: productVariants.sku,
            variantPrice: productVariants.price,
            variantSalePrice: productVariants.salePrice,
            variantInStock: productVariants.inStock,
            variantColorId: productVariants.colorId,
            variantSizeId: productVariants.sizeId,

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
          })
          .from(cartItems)
          .innerJoin(productVariants, eq(productVariants.id, cartItems.productVariantId))
          .innerJoin(products, eq(products.id, productVariants.productId))
          .leftJoin(colors, eq(colors.id, productVariants.colorId))
          .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
          .where(eq(cartItems.id, cartItem.id))
          .limit(1);

        if (!variantData.length) continue;

        const variant = variantData[0];

        // Get variant images - include both variant-specific and product-level images
        const variantImagesData = await db
          .select({
            id: productImages.id,
            url: productImages.url,
            isPrimary: productImages.isPrimary,
            variantId: productImages.variantId,
          })
          .from(productImages)
          .where(eq(productImages.productId, variant.productId))
          .orderBy(desc(productImages.isPrimary), productImages.sortOrder);

        // Filter to prefer variant-specific images, but fall back to product-level images
        const filteredImages = variantImagesData.filter(img =>
          img.variantId === variant.variantId || img.variantId === null
        ).sort((a, b) => {
          // Prioritize variant-specific images over product-level images
          if (a.variantId === variant.variantId && b.variantId === null) return -1;
          if (a.variantId === null && b.variantId === variant.variantId) return 1;
          return 0;
        });

        cartItemsWithDetails.push({
          id: cartItem.id,
          cartId: cartItem.cartId,
          productId: variant.productId, // Use the actual product ID
          productVariantId: cartItem.productVariantId,
          isSimpleProduct: false,
          quantity: cartItem.quantity,
          variant: {
            id: variant.variantId,
            sku: variant.variantSku,
            price: variant.variantPrice,
            salePrice: variant.variantSalePrice,
            inStock: variant.variantInStock,
            product: {
              id: variant.productId,
              name: variant.productName,
              description: variant.productDescription,
            },
            color: variant.colorId ? {
              id: variant.colorId,
              name: variant.colorName!,
              hexCode: variant.colorHexCode!,
            } : null,
            size: variant.sizeId ? {
              id: variant.sizeId,
              name: variant.sizeName!,
            } : null,
            images: filteredImages.map(img => ({
              id: img.id,
              url: img.url,
              isPrimary: img.isPrimary || false,
            })),
          },
        });
      }
    }

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
  productId: z.string().uuid().optional(), // Keep optional for backwards compatibility
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
    // This ensures we can track which product the variant belongs to
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
      // Check if item already exists in cart
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
      // Check if item already exists in cart
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
        // Add new item - NOW INCLUDING PRODUCT_ID!
        await db.insert(cartItems).values({
          cartId: cart.id,
          productId: validatedData.productId, // This was missing!
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