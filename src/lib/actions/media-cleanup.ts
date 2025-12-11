// src/lib/actions/media-cleanup.ts
"use server";

import { deleteUploadThingFile, deleteUploadThingFiles, isUploadThingUrl } from "@/lib/uploadthing-utils";

/**
 * Client-callable server action to delete a single file from UploadThing
 * Used by upload components for immediate cleanup on Replace/Remove actions
 */
export async function deleteMediaFile(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!url || !isUploadThingUrl(url)) {
      return {
        success: false,
        error: "Invalid or non-UploadThing URL",
      };
    }

    const deleted = await deleteUploadThingFile(url);

    if (deleted) {
      console.log(`[CLIENT CLEANUP] Successfully deleted file: ${url}`);
      return { success: true };
    } else {
      return {
        success: false,
        error: "Failed to delete file from storage",
      };
    }
  } catch (error) {
    console.error("[CLIENT CLEANUP] Error deleting file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Client-callable server action to delete multiple files from UploadThing
 * Used for batch cleanup operations
 */
export async function deleteMediaFiles(urls: string[]): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const validUrls = urls.filter(url => url && isUploadThingUrl(url));

    if (validUrls.length === 0) {
      return {
        success: true,
        deletedCount: 0,
      };
    }

    const result = await deleteUploadThingFiles(validUrls);

    console.log(`[CLIENT CLEANUP] Batch deleted ${result.deletedCount} files`);

    return {
      success: result.success,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("[CLIENT CLEANUP] Error deleting files:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Track uploaded files for cleanup if form is abandoned
 * Stores in-memory for session-based tracking
 */
const uploadTracker = new Map<string, { url: string; timestamp: number }>();

/**
 * Register an uploaded file for tracking
 */
export async function trackUploadedFile(url: string, sessionId: string): Promise<void> {
  if (!url || !isUploadThingUrl(url)) return;

  const key = `${sessionId}:${url}`;
  uploadTracker.set(key, {
    url,
    timestamp: Date.now(),
  });

  console.log(`[UPLOAD TRACKER] Registered: ${url}`);
}

/**
 * Mark uploaded files as confirmed (successfully saved to database)
 * Removes from tracking as they are no longer "abandoned"
 */
export async function confirmUploadedFiles(urls: string[], sessionId: string): Promise<void> {
  for (const url of urls) {
    if (!url || !isUploadThingUrl(url)) continue;

    const key = `${sessionId}:${url}`;
    if (uploadTracker.has(key)) {
      uploadTracker.delete(key);
      console.log(`[UPLOAD TRACKER] Confirmed: ${url}`);
    }
  }
}

/**
 * Clean up abandoned uploads older than the specified age (default 24 hours)
 * Should be called periodically (e.g., via cron job or API route)
 */
export async function cleanupAbandonedUploads(maxAgeHours: number = 24): Promise<{ deletedCount: number }> {
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds

  const abandonedUrls: string[] = [];

  // Find all uploads older than maxAge
  for (const [key, data] of uploadTracker.entries()) {
    const age = now - data.timestamp;
    if (age > maxAge) {
      abandonedUrls.push(data.url);
      uploadTracker.delete(key);
    }
  }

  if (abandonedUrls.length === 0) {
    console.log('[UPLOAD TRACKER] No abandoned uploads to clean up');
    return { deletedCount: 0 };
  }

  // Delete abandoned files
  const result = await deleteUploadThingFiles(abandonedUrls);

  console.log(`[UPLOAD TRACKER] Cleaned up ${result.deletedCount} abandoned uploads`);

  return { deletedCount: result.deletedCount };
}

/**
 * Get statistics about tracked uploads
 */
export async function getUploadTrackerStats(): Promise<{
  totalTracked: number;
  oldestTimestamp: number | null;
}> {
  const stats = {
    totalTracked: uploadTracker.size,
    oldestTimestamp: null as number | null,
  };

  if (uploadTracker.size > 0) {
    let oldest = Date.now();
    for (const [, data] of uploadTracker.entries()) {
      if (data.timestamp < oldest) {
        oldest = data.timestamp;
      }
    }
    stats.oldestTimestamp = oldest;
  }

  return stats;
}
