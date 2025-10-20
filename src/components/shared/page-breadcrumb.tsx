// src/components/shared/page-breadcrumb.tsx

import { Breadcrumb, BreadcrumbSeparator, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbItem } from "@/components/ui/breadcrumb";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageBreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <div key={index} className="contents">
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={item.href!}>
                                        {item.label}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </div>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}