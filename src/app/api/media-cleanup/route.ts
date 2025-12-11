// src/app/api/media-cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cleanupAbandonedUploads, getUploadTrackerStats } from '@/lib/actions/media-cleanup';

/**
 * API endpoint for cleaning up abandoned uploads
 * Can be triggered manually or via cron job (Vercel Cron, GitHub Actions, etc.)
 *
 * Example usage:
 * - Manual: GET /api/media-cleanup
 * - Cron: Schedule to run daily/weekly
 * - With age parameter: GET /api/media-cleanup?maxAgeHours=48
 *
 * Security: Should be protected with API key in production
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from authorization header
    const apiKey = request.headers.get('x-api-key');

    // In production, verify API key
    if (process.env.NODE_ENV === 'production') {
      const expectedKey = process.env.MEDIA_CLEANUP_API_KEY;

      if (!expectedKey) {
        return NextResponse.json(
          { error: 'Media cleanup API key not configured' },
          { status: 500 }
        );
      }

      if (apiKey !== expectedKey) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Get max age from query params (default 24 hours)
    const searchParams = request.nextUrl.searchParams;
    const maxAgeHours = parseInt(searchParams.get('maxAgeHours') || '24', 10);

    if (maxAgeHours < 1 || maxAgeHours > 168) { // Max 7 days
      return NextResponse.json(
        { error: 'maxAgeHours must be between 1 and 168 (7 days)' },
        { status: 400 }
      );
    }

    // Get stats before cleanup
    const statsBefore = await getUploadTrackerStats();

    // Run cleanup
    const result = await cleanupAbandonedUploads(maxAgeHours);

    // Get stats after cleanup
    const statsAfter = await getUploadTrackerStats();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} abandoned uploads`,
      data: {
        deletedCount: result.deletedCount,
        maxAgeHours,
        statsBefore,
        statsAfter,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Media cleanup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET statistics about tracked uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Get API key from authorization header
    const apiKey = request.headers.get('x-api-key');

    // In production, verify API key
    if (process.env.NODE_ENV === 'production') {
      const expectedKey = process.env.MEDIA_CLEANUP_API_KEY;

      if (!expectedKey || apiKey !== expectedKey) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const stats = await getUploadTrackerStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
