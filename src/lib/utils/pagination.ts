// src/lib/utils/pagination.ts

/**
 * Pagination utility types
 */
export type PaginationRange = number | "ellipsis";

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationInfo(
    currentPage: number,
    totalCount: number,
    pageSize: number
): PaginationInfo {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    return {
        currentPage: validCurrentPage,
        totalPages,
        pageSize,
        totalCount,
        hasNextPage: validCurrentPage < totalPages,
        hasPreviousPage: validCurrentPage > 1,
        startIndex: Math.min((validCurrentPage - 1) * pageSize + 1, totalCount),
        endIndex: Math.min(validCurrentPage * pageSize, totalCount),
    };
}

/**
 * Generates an array of page numbers with ellipsis for pagination display
 * 
 * @param currentPage - Current active page (1-indexed)
 * @param totalPages - Total number of pages
 * @param siblingCount - Number of pages to show on each side of current page
 * @returns Array of page numbers and "ellipsis" strings
 * 
 * @example
 * generatePaginationRange(5, 10, 1) // [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 * generatePaginationRange(1, 5, 1) // [1, 2, 3, 4, 5]
 */
export function generatePaginationRange(
    currentPage: number,
    totalPages: number,
    siblingCount: number = 1
): PaginationRange[] {
    // Show all pages if total is 7 or less (1 + 2*siblings + 2 ellipsis + 2 edges)
    const totalDisplayablePages = siblingCount * 2 + 5;

    if (totalPages <= totalDisplayablePages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 1: No ellipsis
    if (!shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Case 2: Right ellipsis only
    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, "ellipsis", lastPageIndex];
    }

    // Case 3: Left ellipsis only
    if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = Array.from(
            { length: rightItemCount },
            (_, i) => totalPages - rightItemCount + i + 1
        );
        return [firstPageIndex, "ellipsis", ...rightRange];
    }

    // Case 4: Both ellipses
    const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
    );

    return [firstPageIndex, "ellipsis", ...middleRange, "ellipsis", lastPageIndex];
}

/**
 * Get pagination slice for server-side data fetching
 */
export function getPaginationSlice(page: number, pageSize: number) {
    const validPage = Math.max(1, page);
    const offset = (validPage - 1) * pageSize;

    return {
        offset,
        limit: pageSize,
    };
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePaginationParams(
    page?: number | string | null,
    limit?: number | string | null,
    maxLimit: number = 100
) {
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    return {
        page: Math.max(1, parsedPage || 1),
        limit: Math.min(Math.max(1, parsedLimit || 24), maxLimit),
    };
}