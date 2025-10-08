"use client";

import { useSearchParams } from "next/navigation";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { calculatePaginationInfo, generatePaginationRange } from "@/lib/utils/pagination";

interface PaginationControlsProps {
    totalCount: number;
    pageSize?: number;
    siblingCount?: number;
    showResultsSummary?: boolean;
}

export default function PaginationControls({
    totalCount,
    pageSize = 24,
    siblingCount = 1,
    showResultsSummary = true,
}: PaginationControlsProps) {
    console.log('pageSize: ', pageSize)
    const searchParams = useSearchParams();
    const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

    const paginationInfo = calculatePaginationInfo(currentPage, totalCount, pageSize);
    const pages = generatePaginationRange(
        paginationInfo.currentPage,
        paginationInfo.totalPages,
        siblingCount
    );

    // Helper to create href with updated page param
    const createPageHref = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        return `?${params.toString()}`;
    };

    if (paginationInfo.totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col items-center gap-3 py-6">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href={createPageHref(paginationInfo.currentPage - 1)}
                            aria-disabled={!paginationInfo.hasPreviousPage}
                            className={!paginationInfo.hasPreviousPage ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>

                    {pages.map((page, index) => {
                        if (page === "ellipsis") {
                            return (
                                <PaginationItem key={`ellipsis-${index}`}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            );
                        }

                        const pageNumber = page as number;
                        const isActive = pageNumber === paginationInfo.currentPage;

                        return (
                            <PaginationItem key={pageNumber}>
                                <PaginationLink
                                    href={createPageHref(pageNumber)}
                                    isActive={isActive}
                                    aria-label={`${isActive ? 'Current page, page ' : 'Go to page '}${pageNumber}`}
                                >
                                    {pageNumber}
                                </PaginationLink>
                            </PaginationItem>
                        );
                    })}

                    <PaginationItem>
                        <PaginationNext
                            href={createPageHref(paginationInfo.currentPage + 1)}
                            aria-disabled={!paginationInfo.hasNextPage}
                            className={!paginationInfo.hasNextPage ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>

            {showResultsSummary && (
                <p className="text-sm text-muted-foreground">
                    Showing {paginationInfo.startIndex.toLocaleString()} to{" "}
                    {paginationInfo.endIndex.toLocaleString()} of{" "}
                    {paginationInfo.totalCount.toLocaleString()} results
                </p>
            )}
        </div>
    );
}