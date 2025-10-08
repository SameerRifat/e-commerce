/**
 * Utility functions for managing UploadThing files
 */

// Extract file key from UploadThing URL
export function extractFileKeyFromUrl(url: string): string | null {
  try {
    // UploadThing URLs typically look like: https://utfs.io/f/[fileKey]
    const urlObj = new URL(url);
    
    // Check if it's a valid UploadThing URL
    if (urlObj.hostname === 'utfs.io' && urlObj.pathname.startsWith('/f/')) {
      const fileKey = urlObj.pathname.substring(3); // Remove '/f/' prefix
      return fileKey || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting file key from URL:', error);
    return null;
  }
}

// Check if URL is an UploadThing URL
export function isUploadThingUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'utfs.io';
  } catch {
    return false;
  }
}

/**
 * Delete a file from UploadThing storage
 * Note: This is a placeholder implementation. 
 * When UploadThing server SDK becomes available, replace this with actual deletion.
 */
export async function deleteUploadThingFile(url: string): Promise<boolean> {
  "use server";
  
  try {
    const fileKey = extractFileKeyFromUrl(url);
    
    if (!fileKey) {
      console.warn('Could not extract file key from URL:', url);
      return false;
    }
    
    // TODO: Implement actual file deletion when UploadThing server SDK supports it
    // For now, we'll just log the deletion attempt
    console.log(`[UPLOADTHING CLEANUP] Would delete file with key: ${fileKey} (URL: ${url})`);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // For now, always return true to indicate "success"
    // In a real implementation, this would return the actual result
    return true;
    
    // Future implementation would look like:
    // const { UTApi } = await import("uploadthing/server");
    // const utapi = new UTApi();
    // const result = await utapi.deleteFiles([fileKey]);
    // return result.success;
  } catch (error) {
    console.error('Error deleting UploadThing file:', error);
    return false;
  }
}

/**
 * Delete multiple files from UploadThing storage
 */
export async function deleteUploadThingFiles(urls: string[]): Promise<{ success: boolean; deletedCount: number }> {
  "use server";
  
  const validUrls = urls.filter(url => url && isUploadThingUrl(url));
  
  if (validUrls.length === 0) {
    return { success: true, deletedCount: 0 };
  }
  
  let deletedCount = 0;
  
  // Delete files in batches to avoid overwhelming the service
  const BATCH_SIZE = 10;
  for (let i = 0; i < validUrls.length; i += BATCH_SIZE) {
    const batch = validUrls.slice(i, i + BATCH_SIZE);
    const deletePromises = batch.map(url => deleteUploadThingFile(url));
    
    const results = await Promise.allSettled(deletePromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        deletedCount++;
      } else {
        console.warn(`Failed to delete file: ${batch[index]}`);
      }
    });
  }
  
  return {
    success: deletedCount === validUrls.length,
    deletedCount
  };
}

/**
 * Clean up orphaned files (placeholder for future implementation)
 * This would be used in a background job to clean up files that are no longer referenced
 */
export async function cleanupOrphanedFiles(): Promise<void> {
  "use server";
  
  // TODO: Implement orphaned file cleanup
  // This would involve:
  // 1. Getting all file URLs from UploadThing
  // 2. Checking which ones are still referenced in the database
  // 3. Deleting unreferenced files
  console.log('[UPLOADTHING CLEANUP] Orphaned file cleanup not yet implemented');
}


// // src/lib/uploadthing-utils.ts
// "use server";

// /**
//  * Utility functions for managing UploadThing files
//  */

// // Extract file key from UploadThing URL
// export function extractFileKeyFromUrl(url: string): string | null {
//   try {
//     // UploadThing URLs typically look like: https://utfs.io/f/[fileKey]
//     const urlObj = new URL(url);
    
//     // Check if it's a valid UploadThing URL
//     if (urlObj.hostname === 'utfs.io' && urlObj.pathname.startsWith('/f/')) {
//       const fileKey = urlObj.pathname.substring(3); // Remove '/f/' prefix
//       return fileKey || null;
//     }
    
//     return null;
//   } catch (error) {
//     console.error('Error extracting file key from URL:', error);
//     return null;
//   }
// }

// // Check if URL is an UploadThing URL
// export function isUploadThingUrl(url: string): boolean {
//   try {
//     const urlObj = new URL(url);
//     return urlObj.hostname === 'utfs.io';
//   } catch {
//     return false;
//   }
// }

// /**
//  * Delete a file from UploadThing storage
//  * Note: This is a placeholder implementation. 
//  * When UploadThing server SDK becomes available, replace this with actual deletion.
//  */
// export async function deleteUploadThingFile(url: string): Promise<boolean> {
//   try {
//     const fileKey = extractFileKeyFromUrl(url);
    
//     if (!fileKey) {
//       console.warn('Could not extract file key from URL:', url);
//       return false;
//     }
    
//     // TODO: Implement actual file deletion when UploadThing server SDK supports it
//     // For now, we'll just log the deletion attempt
//     console.log(`[UPLOADTHING CLEANUP] Would delete file with key: ${fileKey} (URL: ${url})`);
    
//     // Simulate async operation
//     await new Promise(resolve => setTimeout(resolve, 100));
    
//     // For now, always return true to indicate "success"
//     // In a real implementation, this would return the actual result
//     return true;
    
//     // Future implementation would look like:
//     // const { UTApi } = await import("uploadthing/server");
//     // const utapi = new UTApi();
//     // const result = await utapi.deleteFiles([fileKey]);
//     // return result.success;
//   } catch (error) {
//     console.error('Error deleting UploadThing file:', error);
//     return false;
//   }
// }

// /**
//  * Delete multiple files from UploadThing storage
//  */
// export async function deleteUploadThingFiles(urls: string[]): Promise<{ success: boolean; deletedCount: number }> {
//   const validUrls = urls.filter(url => url && isUploadThingUrl(url));
  
//   if (validUrls.length === 0) {
//     return { success: true, deletedCount: 0 };
//   }
  
//   let deletedCount = 0;
  
//   // Delete files in batches to avoid overwhelming the service
//   const BATCH_SIZE = 10;
//   for (let i = 0; i < validUrls.length; i += BATCH_SIZE) {
//     const batch = validUrls.slice(i, i + BATCH_SIZE);
//     const deletePromises = batch.map(url => deleteUploadThingFile(url));
    
//     const results = await Promise.allSettled(deletePromises);
    
//     results.forEach((result, index) => {
//       if (result.status === 'fulfilled' && result.value) {
//         deletedCount++;
//       } else {
//         console.warn(`Failed to delete file: ${batch[index]}`);
//       }
//     });
//   }
  
//   return {
//     success: deletedCount === validUrls.length,
//     deletedCount
//   };
// }

// /**
//  * Clean up orphaned files (placeholder for future implementation)
//  * This would be used in a background job to clean up files that are no longer referenced
//  */
// export async function cleanupOrphanedFiles(): Promise<void> {
//   // TODO: Implement orphaned file cleanup
//   // This would involve:
//   // 1. Getting all file URLs from UploadThing
//   // 2. Checking which ones are still referenced in the database
//   // 3. Deleting unreferenced files
//   console.log('[UPLOADTHING CLEANUP] Orphaned file cleanup not yet implemented');
// }
