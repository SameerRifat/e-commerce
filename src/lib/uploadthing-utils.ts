// src/lib/uploadthing-utils.ts
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
 * Uses the UploadThing server SDK to permanently delete files from storage
 * NOTE: This function must only be called from server-side code (server actions/API routes)
 */
export async function deleteUploadThingFile(url: string): Promise<boolean> {
  try {
    const fileKey = extractFileKeyFromUrl(url);

    if (!fileKey) {
      console.warn('[UPLOADTHING CLEANUP] Could not extract file key from URL:', url);
      return false;
    }

    console.log(`[UPLOADTHING CLEANUP] Attempting to delete file with key: ${fileKey}`);

    // Import and use the UploadThing server SDK
    const { UTApi } = await import("uploadthing/server");
    const utapi = new UTApi();

    // Delete the file using the UTApi
    await utapi.deleteFiles(fileKey);

    console.log(`[UPLOADTHING CLEANUP] Successfully deleted file: ${fileKey}`);
    return true;
  } catch (error) {
    console.error('[UPLOADTHING CLEANUP] Error deleting file:', error);
    return false;
  }
}

/**
 * Delete multiple files from UploadThing storage
 * Uses batch deletion for better performance
 * NOTE: This function must only be called from server-side code (server actions/API routes)
 */
export async function deleteUploadThingFiles(urls: string[]): Promise<{ success: boolean; deletedCount: number }> {
  const validUrls = urls.filter(url => url && isUploadThingUrl(url));

  if (validUrls.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  // Extract file keys from URLs
  const fileKeys = validUrls
    .map(url => extractFileKeyFromUrl(url))
    .filter((key): key is string => key !== null);

  if (fileKeys.length === 0) {
    console.warn('[UPLOADTHING CLEANUP] No valid file keys extracted from URLs');
    return { success: false, deletedCount: 0 };
  }

  try {
    console.log(`[UPLOADTHING CLEANUP] Attempting to delete ${fileKeys.length} files in batch`);

    // Import and use the UploadThing server SDK
    const { UTApi } = await import("uploadthing/server");
    const utapi = new UTApi();

    // Delete all files in a single batch operation
    await utapi.deleteFiles(fileKeys);

    console.log(`[UPLOADTHING CLEANUP] Successfully deleted ${fileKeys.length} files`);

    return {
      success: true,
      deletedCount: fileKeys.length
    };
  } catch (error) {
    console.error('[UPLOADTHING CLEANUP] Error deleting files in batch:', error);
    return {
      success: false,
      deletedCount: 0
    };
  }
}

/**
 * Clean up orphaned files (placeholder for future implementation)
 * This would be used in a background job to clean up files that are no longer referenced
 * NOTE: This function must only be called from server-side code (server actions/API routes)
 */
export async function cleanupOrphanedFiles(): Promise<void> {
  // TODO: Implement orphaned file cleanup
  // This would involve:
  // 1. Getting all file URLs from UploadThing
  // 2. Checking which ones are still referenced in the database
  // 3. Deleting unreferenced files
  console.log('[UPLOADTHING CLEANUP] Orphaned file cleanup not yet implemented');
}