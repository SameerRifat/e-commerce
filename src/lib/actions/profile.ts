// src/lib/actions/profile.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Update user profile information (name, email)
 * Modern approach with better validation and error handling
 */
export async function updateUserProfile(
  userId: string,
  data: {
    name: string;
    email: string;
  }
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.id !== userId) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Validate input
    if (!data.name?.trim()) {
      return {
        success: false,
        message: 'Name is required',
      };
    }

    if (!data.email?.trim() || !data.email.includes('@')) {
      return {
        success: false,
        message: 'Valid email is required',
      };
    }

    // Check email uniqueness only if changed
    if (data.email !== session.user.email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      if (existingUser && existingUser.id !== userId) {
        return {
          success: false,
          message: 'This email is already in use',
        };
      }
    }

    await db
      .update(users)
      .set({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Only revalidate the specific profile path, not wildcards
    revalidatePath('/profile');

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update user profile image
 * Modern approach with better URL validation
 */
export async function updateProfileImage(
  userId: string,
  imageUrl: string
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.id !== userId) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    // Validate image URL format
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return {
        success: false,
        message: 'Invalid image URL',
      };
    }

    await db
      .update(users)
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath('/profile');

    return {
      success: true,
      message: 'Profile image updated successfully',
    };
  } catch (error) {
    console.error('Update profile image error:', error);
    return {
      success: false,
      message: 'Failed to update profile image. Please try again.',
    };
  }
}

/**
 * Remove user profile image
 */
export async function removeProfileImage(userId: string): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.id !== userId) {
      return {
        success: false,
        message: 'Unauthorized access',
      };
    }

    await db
      .update(users)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath('/profile');

    return {
      success: true,
      message: 'Profile image removed successfully',
    };
  } catch (error) {
    console.error('Remove profile image error:', error);
    return {
      success: false,
      message: 'Failed to remove profile image',
    };
  }
}

/**
 * Change user password
 * Modern approach with better error messages
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: 'Please sign in to change your password',
      };
    }

    // Validate passwords
    if (!data.currentPassword || data.currentPassword.length < 8) {
      return {
        success: false,
        message: 'Current password must be at least 8 characters',
      };
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      return {
        success: false,
        message: 'New password must be at least 8 characters',
      };
    }

    if (data.currentPassword === data.newPassword) {
      return {
        success: false,
        message: 'New password must be different from current password',
      };
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        headers: await headers(),
      });

      // No need to revalidate for password changes
      // The password is not displayed on the profile page

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      if (
        error.message?.toLowerCase().includes('password') ||
        error.message?.toLowerCase().includes('incorrect') ||
        error.message?.toLowerCase().includes('invalid')
      ) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: 'Failed to change password. Please try again.',
    };
  }
}


// // src/lib/actions/profile.ts (MODERNIZED VERSION)
// 'use server';

// import { revalidatePath } from 'next/cache';
// import { db } from '@/lib/db';
// import { users } from '@/lib/db/schema';
// import { eq } from 'drizzle-orm';
// import { auth } from '@/lib/auth';
// import { headers } from 'next/headers';

// export interface ActionResponse {
//   success: boolean;
//   message?: string;
//   data?: any;
// }

// /**
//  * Update user profile information (name, email)
//  * Modern approach with better validation and error handling
//  */
// export async function updateUserProfile(
//   userId: string,
//   data: {
//     name: string;
//     email: string;
//   }
// ): Promise<ActionResponse> {
//   try {
//     const session = await auth.api.getSession({ headers: await headers() });

//     if (!session?.user || session.user.id !== userId) {
//       return {
//         success: false,
//         message: 'Unauthorized access',
//       };
//     }

//     // Validate input
//     if (!data.name?.trim()) {
//       return {
//         success: false,
//         message: 'Name is required',
//       };
//     }

//     if (!data.email?.trim() || !data.email.includes('@')) {
//       return {
//         success: false,
//         message: 'Valid email is required',
//       };
//     }

//     // Check email uniqueness only if changed
//     if (data.email !== session.user.email) {
//       const existingUser = await db.query.users.findFirst({
//         where: eq(users.email, data.email),
//       });

//       if (existingUser && existingUser.id !== userId) {
//         return {
//           success: false,
//           message: 'This email is already in use',
//         };
//       }
//     }

//     await db
//       .update(users)
//       .set({
//         name: data.name.trim(),
//         email: data.email.toLowerCase().trim(),
//         updatedAt: new Date(),
//       })
//       .where(eq(users.id, userId));

//     revalidatePath('/profile');
//     revalidatePath('/profile/*');

//     return {
//       success: true,
//       message: 'Profile updated successfully',
//     };
//   } catch (error) {
//     console.error('Update profile error:', error);
//     return {
//       success: false,
//       message: 'An unexpected error occurred. Please try again.',
//     };
//   }
// }

// /**
//  * Update user profile image
//  * Modern approach with better URL validation
//  */
// export async function updateProfileImage(
//   userId: string,
//   imageUrl: string
// ): Promise<ActionResponse> {
//   try {
//     const session = await auth.api.getSession({ headers: await headers() });

//     if (!session?.user || session.user.id !== userId) {
//       return {
//         success: false,
//         message: 'Unauthorized access',
//       };
//     }

//     // Validate image URL format
//     if (!imageUrl || !imageUrl.startsWith('http')) {
//       return {
//         success: false,
//         message: 'Invalid image URL',
//       };
//     }

//     await db
//       .update(users)
//       .set({
//         image: imageUrl,
//         updatedAt: new Date(),
//       })
//       .where(eq(users.id, userId));

//     revalidatePath('/profile');
//     revalidatePath('/profile/*');

//     return {
//       success: true,
//       message: 'Profile image updated successfully',
//     };
//   } catch (error) {
//     console.error('Update profile image error:', error);
//     return {
//       success: false,
//       message: 'Failed to update profile image. Please try again.',
//     };
//   }
// }

// /**
//  * Remove user profile image
//  */
// export async function removeProfileImage(userId: string): Promise<ActionResponse> {
//   try {
//     const session = await auth.api.getSession({ headers: await headers() });

//     if (!session?.user || session.user.id !== userId) {
//       return {
//         success: false,
//         message: 'Unauthorized access',
//       };
//     }

//     await db
//       .update(users)
//       .set({
//         image: null,
//         updatedAt: new Date(),
//       })
//       .where(eq(users.id, userId));

//     revalidatePath('/profile');
//     revalidatePath('/profile/*');

//     return {
//       success: true,
//       message: 'Profile image removed successfully',
//     };
//   } catch (error) {
//     console.error('Remove profile image error:', error);
//     return {
//       success: false,
//       message: 'Failed to remove profile image',
//     };
//   }
// }

// /**
//  * Change user password
//  * Modern approach with better error messages
//  */
// export async function changePassword(data: {
//   currentPassword: string;
//   newPassword: string;
// }): Promise<ActionResponse> {
//   try {
//     const session = await auth.api.getSession({ headers: await headers() });

//     if (!session?.user) {
//       return {
//         success: false,
//         message: 'Please sign in to change your password',
//       };
//     }

//     // Validate passwords
//     if (!data.currentPassword || data.currentPassword.length < 8) {
//       return {
//         success: false,
//         message: 'Current password must be at least 8 characters',
//       };
//     }

//     if (!data.newPassword || data.newPassword.length < 8) {
//       return {
//         success: false,
//         message: 'New password must be at least 8 characters',
//       };
//     }

//     if (data.currentPassword === data.newPassword) {
//       return {
//         success: false,
//         message: 'New password must be different from current password',
//       };
//     }

//     try {
//       await auth.api.changePassword({
//         body: {
//           currentPassword: data.currentPassword,
//           newPassword: data.newPassword,
//         },
//         headers: await headers(),
//       });

//       return {
//         success: true,
//         message: 'Password changed successfully',
//       };
//     } catch (error: any) {
//       if (
//         error.message?.toLowerCase().includes('password') ||
//         error.message?.toLowerCase().includes('incorrect') ||
//         error.message?.toLowerCase().includes('invalid')
//       ) {
//         return {
//           success: false,
//           message: 'Current password is incorrect',
//         };
//       }
//       throw error;
//     }
//   } catch (error) {
//     console.error('Change password error:', error);
//     return {
//       success: false,
//       message: 'Failed to change password. Please try again.',
//     };
//   }
// }