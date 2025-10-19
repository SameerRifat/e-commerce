// src/lib/actions/checkout.ts
"use server";

import { db } from "@/lib/db";
import { 
  orders, 
  orderItems, 
  products, 
  productVariants,
  productImages,
  addresses,
  carts,
  cartItems,
  colors,
  sizes,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { getUserAddresses } from "./address-management";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid("Invalid shipping address"),
  billingAddressId: z.string().uuid("Invalid billing address").optional(),
  useSameAddress: z.boolean(),
  paymentMethod: z.enum(['cod', 'jazzcash', 'easypaisa'], {
    message: "Invalid payment method"
  }),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
}).refine(
  (data) => data.useSameAddress || data.billingAddressId,
  {
    message: "Billing address is required when not using same address",
    path: ["billingAddressId"],
  }
);

export type CheckoutInput = z.infer<typeof checkoutSchema>;

interface CartItemForCheckout {
  id: string;
  productId: string | null;
  productVariantId: string | null;
  isSimpleProduct: boolean;
  quantity: number;
  productName: string;
  productSlug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  inStock: number;
  image: string | null;
  // Variant details for display
  color?: {
    name: string;
    hexCode: string;
  };
  size?: {
    name: string;
  };
}

interface CheckoutValidation {
  success: boolean;
  data?: {
    cartItems: CartItemForCheckout[];
    userAddresses: Awaited<ReturnType<typeof getUserAddresses>>;
    calculation: {
      subtotal: string;
      shippingCost: string;
      taxAmount: string;
      totalAmount: string;
    };
  };
  error?: string;
  redirectTo?: string;
}

// INITIALIZE CHECKOUT - Called when page loads
export async function initializeCheckout(): Promise<CheckoutValidation> {
  try {
    // 1. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Please sign in to continue",
        redirectTo: "/sign-in?returnUrl=/checkout",
      };
    }

    // 2. Get cart with items
    const userCart = await db.query.carts.findFirst({
      where: eq(carts.userId, user.id),
      with: {
        items: true,
      },
    });

    if (!userCart || !userCart.items.length) {
      return {
        success: false,
        error: "Your cart is empty",
        redirectTo: "/cart",
      };
    }

    // 3. Transform and validate cart items with detailed information
    const cartItems: CartItemForCheckout[] = [];
    const errors: string[] = [];

    for (const item of userCart.items) {
      if (item.isSimpleProduct && item.productId) {
        // Handle simple product
        const productData = await db
          .select({
            id: products.id,
            name: products.name,
            slug: products.slug,
            sku: products.sku,
            price: products.price,
            salePrice: products.salePrice,
            inStock: products.inStock,
          })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!productData.length) {
          errors.push("Some items in your cart are no longer available");
          continue;
        }

        const product = productData[0];

        // Get product image
        const productImagesData = await db
          .select({
            url: productImages.url,
          })
          .from(productImages)
          .where(and(
            eq(productImages.productId, product.id),
            sql`${productImages.variantId} IS NULL`
          ))
          .orderBy(desc(productImages.isPrimary), productImages.sortOrder)
          .limit(1);

        // Check stock
        const currentStock = product.inStock ?? 0;
        if (currentStock < item.quantity) {
          errors.push(
            `"${product.name}" only has ${currentStock} in stock (you requested ${item.quantity})`
          );
          continue;
        }

        cartItems.push({
          id: item.id,
          productId: product.id,
          productVariantId: null,
          isSimpleProduct: true,
          quantity: item.quantity,
          productName: product.name,
          productSlug: product.slug,
          sku: product.sku || 'N/A',
          price: parseFloat(product.price || '0'),
          salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
          inStock: product.inStock || 0,
          image: productImagesData[0]?.url || null,
        });
      } else if (!item.isSimpleProduct && item.productVariantId) {
        // Handle configurable product variant
        const variantData = await db
          .select({
            variantId: productVariants.id,
            variantSku: productVariants.sku,
            variantPrice: productVariants.price,
            variantSalePrice: productVariants.salePrice,
            variantInStock: productVariants.inStock,
            
            productId: products.id,
            productName: products.name,
            productSlug: products.slug,
            
            colorName: colors.name,
            colorHexCode: colors.hexCode,
            
            sizeName: sizes.name,
          })
          .from(productVariants)
          .innerJoin(products, eq(products.id, productVariants.productId))
          .leftJoin(colors, eq(colors.id, productVariants.colorId))
          .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
          .where(eq(productVariants.id, item.productVariantId))
          .limit(1);

        if (!variantData.length) {
          errors.push("Some items in your cart are no longer available");
          continue;
        }

        const variant = variantData[0];

        // Get variant images
        const variantImagesData = await db
          .select({
            url: productImages.url,
            variantId: productImages.variantId,
          })
          .from(productImages)
          .where(eq(productImages.productId, variant.productId))
          .orderBy(desc(productImages.isPrimary), productImages.sortOrder);

        // Prioritize variant-specific images
        const variantImage = variantImagesData.find(img => img.variantId === variant.variantId);
        const fallbackImage = variantImagesData.find(img => img.variantId === null);
        const imageUrl = variantImage?.url || fallbackImage?.url || null;

        // Build variant name
        const variantDetails = [
          variant.colorName,
          variant.sizeName
        ].filter(Boolean).join(', ');
        
        const displayName = variantDetails 
          ? `${variant.productName} (${variantDetails})`
          : variant.productName;

        // Check stock
        if (variant.variantInStock < item.quantity) {
          errors.push(
            `"${displayName}" only has ${variant.variantInStock} in stock (you requested ${item.quantity})`
          );
          continue;
        }

        cartItems.push({
          id: item.id,
          productId: variant.productId,
          productVariantId: variant.variantId,
          isSimpleProduct: false,
          quantity: item.quantity,
          productName: displayName,
          productSlug: variant.productSlug,
          sku: variant.variantSku || 'N/A',
          price: parseFloat(variant.variantPrice || '0'),
          salePrice: variant.variantSalePrice ? parseFloat(variant.variantSalePrice) : null,
          inStock: variant.variantInStock || 0,
          image: imageUrl,
          color: variant.colorName ? {
            name: variant.colorName,
            hexCode: variant.colorHexCode!,
          } : undefined,
          size: variant.sizeName ? {
            name: variant.sizeName,
          } : undefined,
        });
      }
    }

    // If any items have stock issues, return error
    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join(". "),
      };
    }

    if (cartItems.length === 0) {
      return {
        success: false,
        error: "No valid items in cart",
        redirectTo: "/cart",
      };
    }

    // 4. Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.salePrice ?? item.price;
      return sum + (price * item.quantity);
    }, 0);

    const shippingCost = subtotal >= 2500 ? 0 : 250;
    const taxAmount = Math.round(subtotal * 0.1);
    const totalAmount = subtotal + shippingCost + taxAmount;

    // 5. Get user addresses
    const userAddresses = await getUserAddresses();

    return {
      success: true,
      data: {
        cartItems,
        userAddresses,
        calculation: {
          subtotal: subtotal.toString(),
          shippingCost: shippingCost.toString(),
          taxAmount: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
        },
      },
    };
  } catch (error) {
    console.error("Error initializing checkout:", error);
    return {
      success: false,
      error: "Failed to load checkout. Please try again.",
    };
  }
}

// PROCESS ORDER - Single atomic operation
export async function processOrder(input: CheckoutInput): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  try {
    // 1. Validate input
    const validation = checkoutSchema.safeParse(input);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const field = err.path[0]?.toString() || 'form';
        fieldErrors[field] = err.message;
      });
      return {
        success: false,
        error: "Please check your form for errors",
        fieldErrors,
      };
    }

    const data = validation.data;

    // 2. Verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Session expired. Please sign in again.",
      };
    }

    // 3. Execute order creation in transaction
    const result = await db.transaction(async (tx) => {
      // 3a. Get and lock cart with items
      const userCart = await tx.query.carts.findFirst({
        where: eq(carts.userId, user.id),
        with: {
          items: true,
        },
      });

      if (!userCart || !userCart.items.length) {
        throw new Error("Your cart is empty");
      }

      // 3b. Verify addresses belong to user
      const userAddressIds = (await tx
        .select({ id: addresses.id })
        .from(addresses)
        .where(eq(addresses.userId, user.id)))
        .map(a => a.id);

      if (!userAddressIds.includes(data.shippingAddressId)) {
        throw new Error("Invalid shipping address");
      }

      const billingId = data.useSameAddress 
        ? data.shippingAddressId 
        : data.billingAddressId;

      if (billingId && !userAddressIds.includes(billingId)) {
        throw new Error("Invalid billing address");
      }

      // 3c. Validate inventory and deduct stock atomically
      const orderItemsData: Array<{
        productId: string | null;
        productVariantId: string | null;
        isSimpleProduct: boolean;
        quantity: number;
        priceAtPurchase: string;
        salePriceAtPurchase: string | null;
      }> = [];

      let subtotal = 0;

      for (const item of userCart.items) {
        if (item.isSimpleProduct && item.productId) {
          // Lock and validate simple product
          const [product] = await tx
            .select({
              id: products.id,
              name: products.name,
              price: products.price,
              salePrice: products.salePrice,
              inStock: products.inStock,
            })
            .from(products)
            .where(eq(products.id, item.productId))
            .for('update');

          if (!product) {
            throw new Error("Product no longer available");
          }

          const currentStock = product.inStock || 0;
          if (currentStock < item.quantity) {
            throw new Error(
              `"${product.name}" only has ${currentStock} in stock`
            );
          }

          // Deduct inventory
          await tx
            .update(products)
            .set({
              inStock: sql`${products.inStock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, product.id));

          const price = parseFloat(product.price || '0');
          const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
          const finalPrice = salePrice ?? price;

          subtotal += finalPrice * item.quantity;

          orderItemsData.push({
            productId: product.id,
            productVariantId: null,
            isSimpleProduct: true,
            quantity: item.quantity,
            priceAtPurchase: price.toString(),
            salePriceAtPurchase: salePrice?.toString() || null,
          });
        } else if (!item.isSimpleProduct && item.productVariantId) {
          // Lock and validate variant
          const [variant] = await tx
            .select({
              id: productVariants.id,
              productId: productVariants.productId,
              price: productVariants.price,
              salePrice: productVariants.salePrice,
              inStock: productVariants.inStock,
            })
            .from(productVariants)
            .where(eq(productVariants.id, item.productVariantId))
            .for('update');

          if (!variant) {
            throw new Error("Product variant no longer available");
          }

          const currentStock = variant.inStock || 0;
          if (currentStock < item.quantity) {
            throw new Error(
              `Product variant only has ${currentStock} in stock`
            );
          }

          // Deduct inventory
          await tx
            .update(productVariants)
            .set({
              inStock: sql`${productVariants.inStock} - ${item.quantity}`,
            })
            .where(eq(productVariants.id, variant.id));

          const price = parseFloat(variant.price || '0');
          const salePrice = variant.salePrice ? parseFloat(variant.salePrice) : null;
          const finalPrice = salePrice ?? price;

          subtotal += finalPrice * item.quantity;

          orderItemsData.push({
            productId: variant.productId,
            productVariantId: variant.id,
            isSimpleProduct: false,
            quantity: item.quantity,
            priceAtPurchase: price.toString(),
            salePriceAtPurchase: salePrice?.toString() || null,
          });
        }
      }

      // 3d. Calculate final totals
      const shippingCost = subtotal >= 2500 ? 0 : 250;
      const taxAmount = Math.round(subtotal * 0.1);
      const totalAmount = subtotal + shippingCost + taxAmount;

      // 3e. Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          status: 'pending',
          totalAmount: totalAmount.toString(),
          subtotal: subtotal.toString(),
          shippingCost: shippingCost.toString(),
          taxAmount: taxAmount.toString(),
          shippingAddressId: data.shippingAddressId,
          billingAddressId: billingId || null,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
        })
        .returning({ id: orders.id });

      // 3f. Create order items
      await tx.insert(orderItems).values(
        orderItemsData.map(item => ({
          ...item,
          orderId: newOrder.id,
        }))
      );

      // 3g. Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, userCart.id));

      return newOrder.id;
    });

    // 4. Revalidate pages
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/profile/orders");

    return {
      success: true,
      orderId: result,
    };
  } catch (error) {
    console.error("Error processing order:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to process order. Please try again.";

    return {
      success: false,
      error: errorMessage,
    };
  }
}