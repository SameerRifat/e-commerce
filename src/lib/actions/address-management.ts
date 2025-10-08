// src/lib/actions/address-management.ts
"use server";

import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { 
  insertAddressSchema, 
  type AddressFormValues,
  type SelectAddress 
} from "@/lib/db/schema/addresses";
import { eq, and, asc, desc, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/actions";

// Types for server action responses
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Enhanced address type for client
export interface AddressWithMetadata extends SelectAddress {
  createdAt?: Date;
  updatedAt?: Date;
}

// Get current user's addresses
export async function getUserAddresses(): Promise<AddressWithMetadata[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(desc(addresses.isDefault), asc(addresses.type));

    return userAddresses;
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return [];
  }
}

// Get a single address by ID (with user ownership check)
export async function getAddressById(addressId: string): Promise<SelectAddress | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const result = await db
      .select()
      .from(addresses)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, user.id)
      ))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching address by ID:", error);
    return null;
  }
}

// Helper function to handle default address logic
async function handleDefaultAddress(
  userId: string, 
  addressType: 'shipping' | 'billing', 
  excludeAddressId?: string
): Promise<void> {
  try {
    const conditions = [
      eq(addresses.userId, userId),
      eq(addresses.type, addressType)
    ];
    
    if (excludeAddressId) {
      conditions.push(ne(addresses.id, excludeAddressId));
    }
    
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(and(...conditions));
  } catch (error) {
    console.error("Error handling default address:", error);
    throw error;
  }
}

// Create address function
export async function createAddress(
  formData: AddressFormValues
): Promise<ActionResult<{ addressId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required. Please sign in to continue.",
      };
    }

    // Server-side validation with the shared schema
    const validation = insertAddressSchema.safeParse({
      ...formData,
      userId: user.id,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      });

      return {
        success: false,
        error: "Validation failed",
        fieldErrors,
      };
    }

    const addressData = validation.data;

    // Handle default address logic
    if (addressData.isDefault) {
      await handleDefaultAddress(user.id, addressData.type);
    }

    // Create the address
    const [createdAddress] = await db
      .insert(addresses)
      .values(addressData)
      .returning({ id: addresses.id });

    // Revalidate relevant paths
    revalidatePath('/profile/addresses');
    revalidatePath('/checkout');

    return {
      success: true,
      data: { addressId: createdAddress.id },
    };
  } catch (error) {
    console.error("Error creating address:", error);
    return {
      success: false,
      error: "Failed to create address. Please try again.",
    };
  }
}

// Update address function
export async function updateAddress(
  addressId: string,
  formData: AddressFormValues
): Promise<ActionResult<{ addressId: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required. Please sign in to continue.",
      };
    }

    // Check if address exists and belongs to user
    const existingAddress = await getAddressById(addressId);
    if (!existingAddress) {
      return {
        success: false,
        error: "Address not found or access denied.",
      };
    }

    // Server-side validation
    const validation = insertAddressSchema.safeParse({
      ...formData,
      userId: user.id,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      });

      return {
        success: false,
        error: "Validation failed",
        fieldErrors,
      };
    }

    // Handle default address logic
    if (formData.isDefault) {
      await handleDefaultAddress(user.id, formData.type, addressId);
    }

    // Update the address
    await db
      .update(addresses)
      .set(formData)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, user.id)
      ));

    // Revalidate relevant paths
    revalidatePath('/profile/addresses');
    revalidatePath('/checkout');

    return {
      success: true,
      data: { addressId },
    };
  } catch (error) {
    console.error("Error updating address:", error);
    return {
      success: false,
      error: "Failed to update address. Please try again.",
    };
  }
}

// Delete address function
export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required. Please sign in to continue.",
      };
    }

    // Check if address exists and belongs to user
    const existingAddress = await getAddressById(addressId);
    if (!existingAddress) {
      return {
        success: false,
        error: "Address not found or access denied.",
      };
    }

    // Delete the address
    await db
      .delete(addresses)
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, user.id)
      ));

    // Revalidate relevant paths
    revalidatePath('/profile/addresses');
    revalidatePath('/checkout');

    return { success: true };
  } catch (error) {
    console.error("Error deleting address:", error);
    return {
      success: false,
      error: "Failed to delete address. Please try again.",
    };
  }
}

// Set default address function
export async function setDefaultAddress(
  addressId: string, 
  addressType: 'shipping' | 'billing'
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required. Please sign in to continue.",
      };
    }

    // Check if address exists and belongs to user
    const existingAddress = await getAddressById(addressId);
    if (!existingAddress || existingAddress.type !== addressType) {
      return {
        success: false,
        error: "Address not found or type mismatch.",
      };
    }

    // Handle default address logic (unset others first)
    await handleDefaultAddress(user.id, addressType, addressId);

    // Set this address as default
    await db
      .update(addresses)
      .set({ isDefault: true })
      .where(and(
        eq(addresses.id, addressId),
        eq(addresses.userId, user.id)
      ));

    // Revalidate relevant paths
    revalidatePath('/profile/addresses');
    revalidatePath('/checkout');

    return { success: true };
  } catch (error) {
    console.error("Error setting default address:", error);
    return {
      success: false,
      error: "Failed to set default address. Please try again.",
    };
  }
}

// Get user's default addresses
export async function getDefaultAddresses(): Promise<{
  shipping: SelectAddress | null;
  billing: SelectAddress | null;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { shipping: null, billing: null };
    }

    const defaultAddresses = await db
      .select()
      .from(addresses)
      .where(and(
        eq(addresses.userId, user.id),
        eq(addresses.isDefault, true)
      ));

    return {
      shipping: defaultAddresses.find(addr => addr.type === 'shipping') || null,
      billing: defaultAddresses.find(addr => addr.type === 'billing') || null,
    };
  } catch (error) {
    console.error("Error fetching default addresses:", error);
    return { shipping: null, billing: null };
  }
}

// Get addresses by type
export async function getAddressesByType(
  type: 'shipping' | 'billing'
): Promise<SelectAddress[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(and(
        eq(addresses.userId, user.id),
        eq(addresses.type, type)
      ))
      .orderBy(desc(addresses.isDefault));

    return userAddresses;
  } catch (error) {
    console.error("Error fetching addresses by type:", error);
    return [];
  }
}